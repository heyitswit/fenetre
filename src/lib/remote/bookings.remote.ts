import { command, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import {
	bookings,
	briefs,
	eventTypes,
	prospectInsights,
	prospectTracking,
	userSettings
} from '$lib/server/db/schema';
import { loadBookingConfirmation, loadBookingByToken } from '$lib/server/public-queries';
import {
	createCalendarEvent,
	deleteCalendarEvent,
	invalidateBusySlotsCache,
	updateCalendarEvent
} from '$lib/server/google';
import { sendConfirmationToClient, sendNotificationToFreelance } from '$lib/server/resend';
import { phoneCallPlaceholder } from '$lib/server/phone-location';
import { bookingLimiter, formLimiter } from '$lib/server/limiter';
import { requireAuth } from '$lib/server/remote-helpers';
import { getLocale, type Locale } from '$lib/paraglide/runtime';
import { error } from '@sveltejs/kit';
import { and, count, desc, eq, getTableColumns, gt, gte, isNull, lt, ne } from 'drizzle-orm';
import * as z from 'zod';

const PHONE_REVEAL_WINDOW_MS = 30 * 60 * 1000;

// Delayed reveal: never ship the client's number to the client (the freelance UI) until the
// reveal window — even hidden in the UI, anything returned here is visible in the network tab.
function gatePhone<
	T extends { clientPhone: string | null; phoneRevealedAt: Date | null; startTime: Date }
>(booking: T): T {
	const revealed =
		booking.phoneRevealedAt != null ||
		booking.startTime.getTime() - Date.now() <= PHONE_REVEAL_WINDOW_MS;
	return revealed ? booking : { ...booking, clientPhone: null };
}

export const getUpcomingBookings = query(async () => {
	const user = requireAuth();
	const rows = await db.query.bookings.findMany({
		where: and(
			eq(bookings.userId, user.id),
			eq(bookings.status, 'confirmed'),
			gte(bookings.startTime, new Date())
		),
		with: { eventType: true, brief: true },
		orderBy: bookings.startTime
	});
	return rows.map(gatePhone);
});

export const getDashboardStats = query(async () => {
	const user = requireAuth();
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const todayEnd = new Date(todayStart.getTime() + 86_400_000);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

	const [todayRows, monthRows] = await Promise.all([
		db
			.select({ count: count() })
			.from(bookings)
			.where(
				and(
					eq(bookings.userId, user.id),
					ne(bookings.status, 'cancelled'),
					gte(bookings.startTime, todayStart),
					lt(bookings.startTime, todayEnd)
				)
			),
		db
			.select({ count: count() })
			.from(bookings)
			.where(
				and(
					eq(bookings.userId, user.id),
					gte(bookings.startTime, monthStart),
					lt(bookings.startTime, monthEnd)
				)
			)
	]);

	return {
		todayCount: todayRows[0].count,
		thisMonthCount: monthRows[0].count
	};
});

type ConversionRow = { total: number; signed: number };
function emptyRow(): ConversionRow {
	return { total: 0, signed: 0 };
}

// Closes the loop the AI score opens: which sources and which score bands actually sign.
export const getConversionAnalytics = query(async () => {
	const user = requireAuth();
	const rows = await db
		.select({
			source: bookings.source,
			outcome: prospectTracking.outcome,
			score: prospectInsights.compatibilityScore
		})
		.from(bookings)
		.leftJoin(prospectTracking, eq(prospectTracking.bookingId, bookings.id))
		.leftJoin(prospectInsights, eq(prospectInsights.bookingId, bookings.id))
		.where(eq(bookings.userId, user.id));

	const totals = { total: 0, signed: 0, declined: 0, ghost: 0, followup: 0, pending: 0 };
	const bySource = new Map<string, ConversionRow>();
	const byScoreBand = new Map<string, ConversionRow>();

	const scoreBand = (score: number | null): string => {
		if (score === null) return 'unscored';
		if (score >= 80) return 'high';
		if (score >= 50) return 'mid';
		return 'low';
	};

	for (const r of rows) {
		const outcome = r.outcome ?? 'pending';
		const signed = outcome === 'signed' ? 1 : 0;

		totals.total++;
		if (outcome in totals) (totals as Record<string, number>)[outcome]++;

		const src = r.source ?? 'direct';
		const sRow = bySource.get(src) ?? emptyRow();
		sRow.total++;
		sRow.signed += signed;
		bySource.set(src, sRow);

		const band = scoreBand(r.score);
		const bRow = byScoreBand.get(band) ?? emptyRow();
		bRow.total++;
		bRow.signed += signed;
		byScoreBand.set(band, bRow);
	}

	const withRate = (m: Map<string, ConversionRow>) =>
		[...m.entries()]
			.map(([key, v]) => ({
				key,
				...v,
				rate: v.total ? Math.round((v.signed / v.total) * 100) : 0
			}))
			.sort((a, b) => b.total - a.total);

	return {
		totals,
		bySource: withRate(bySource),
		byScoreBand: withRate(byScoreBand)
	};
});

export const getAllBookings = query(async () => {
	const user = requireAuth();
	const rows = await db.query.bookings.findMany({
		where: eq(bookings.userId, user.id),
		with: { eventType: true, brief: true },
		orderBy: desc(bookings.createdAt)
	});
	return rows.map(gatePhone);
});

export const getBookingConfirmation = query(z.object({ id: z.string().uuid() }), async ({ id }) =>
	loadBookingConfirmation(id)
);

export const getBookingByToken = query(z.object({ token: z.string() }), async ({ token }) =>
	loadBookingByToken(token)
);

export const getBookingById = query(z.object({ id: z.string().uuid() }), async ({ id }) => {
	const user = requireAuth();
	const booking = await db.query.bookings.findFirst({
		where: and(eq(bookings.id, id), eq(bookings.userId, user.id)),
		with: { eventType: true, brief: true, insights: true, tracking: true }
	});
	if (!booking) error(404, 'Booking not found');
	return gatePhone(booking);
});

export const saveBrief = command(
	z.object({
		briefId: z.string().uuid().optional(),
		username: z.string(),
		clientEmail: z.email(),
		companyName: z.string().optional(),
		projectDescription: z.string().optional(),
		stack: z.string().optional(),
		missionType: z.string().optional(),
		budget: z.string().optional(),
		urgency: z.string().optional(),
		customFields: z.record(z.string(), z.string()).optional(),
		companySiren: z.string().optional()
	}),
	async ({ briefId, username, ...input }) => {
		if (await formLimiter.isLimited(getRequestEvent())) error(429, 'Too many requests');
		const [owner] = await db
			.select({ userId: userSettings.userId })
			.from(userSettings)
			.where(eq(userSettings.username, username))
			.limit(1);
		const values = { ...input, userId: owner?.userId ?? null };

		// Reuse the same row when the client edits and resubmits (e.g. via the back button),
		// otherwise stale orphan briefs would later trigger bogus recovery emails.
		if (briefId) {
			const [updated] = await db
				.update(briefs)
				.set(values)
				.where(and(eq(briefs.id, briefId), isNull(briefs.bookingId)))
				.returning({ id: briefs.id });
			if (updated) return { briefId: updated.id };
		}

		const [brief] = await db.insert(briefs).values(values).returning({ id: briefs.id });
		return { briefId: brief.id };
	}
);

export const createBooking = command(
	z.object({
		briefId: z.string().uuid(),
		username: z.string(),
		eventTypeSlug: z.string(),
		startTime: z.string(),
		clientName: z.string().min(2),
		clientEmail: z.email(),
		clientLinkedin: z.string().optional(),
		clientPhone: z.string().optional(),
		source: z.string().optional()
	}),
	async (input) => {
		if (await bookingLimiter.isLimited(getRequestEvent())) error(429, 'Too many requests');

		const [row] = await db
			.select({
				...getTableColumns(eventTypes),
				notificationEmail: userSettings.notificationEmail,
				bufferMinutes: userSettings.bufferMinutes,
				preferredLocale: userSettings.preferredLocale
			})
			.from(eventTypes)
			.innerJoin(userSettings, eq(eventTypes.userId, userSettings.userId))
			.where(
				and(eq(userSettings.username, input.username), eq(eventTypes.slug, input.eventTypeSlug))
			)
			.limit(1);

		if (!row) error(404, 'Event type not found');

		if (row.locationType === 'phone' && !input.clientPhone?.trim()) {
			error(400, 'Phone number required for a phone call');
		}

		const { userId, notificationEmail, bufferMinutes, preferredLocale } = row;
		const startTime = new Date(input.startTime);
		const endTime = new Date(startTime.getTime() + row.duration * 60_000);
		const rescheduleToken = crypto.randomUUID();
		const locale = getLocale();

		const [booking] = await db.transaction(async (tx) => {
			const [conflict] = await tx
				.select({ id: bookings.id })
				.from(bookings)
				.where(
					and(
						eq(bookings.userId, userId),
						ne(bookings.status, 'cancelled'),
						gt(bookings.endTime, new Date(startTime.getTime() - bufferMinutes * 60_000)),
						lt(bookings.startTime, new Date(endTime.getTime() + bufferMinutes * 60_000))
					)
				)
				.limit(1);

			if (conflict) error(409, 'Slot no longer available');

			return tx
				.insert(bookings)
				.values({
					userId,
					eventTypeId: row.id,
					clientName: input.clientName,
					clientEmail: input.clientEmail,
					clientLinkedin: input.clientLinkedin,
					clientPhone: input.clientPhone?.trim() || null,
					startTime,
					endTime,
					source: input.source ?? 'direct',
					rescheduleToken,
					locale
				})
				.returning();
		});

		invalidateBusySlotsCache(userId);

		void (async () => {
			try {
				const [, { eventId: googleEventId, meetLink }] = await Promise.all([
					db.update(briefs).set({ bookingId: booking.id }).where(eq(briefs.id, input.briefId)),
					createCalendarEvent(userId, {
						summary: `${row.name} — ${input.clientName}`,
						description: 'Booked via fenêtre',
						startTime,
						endTime,
						attendeeEmail: input.clientEmail,
						locationType: row.locationType as 'meet' | 'phone',
						location: row.locationType === 'phone' ? phoneCallPlaceholder(locale) : undefined
					})
				]);

				await db
					.update(bookings)
					.set({ googleEventId, meetLink })
					.where(eq(bookings.id, booking.id));

				const fullBooking = await db.query.bookings.findFirst({
					where: eq(bookings.id, booking.id),
					with: { eventType: true, brief: true }
				});
				if (!fullBooking) return;

				// Client confirmation first — no need to wait for enrichment
				await sendConfirmationToClient(fullBooking);

				// Pappers then AI brief (sequential — AI uses company data)
				const { fetchPappersData } = await import('$lib/server/pappers');
				const { generateAiBrief } = await import('$lib/server/ai-brief');

				const companyName = fullBooking.brief?.companyName ?? '';
				const companySiren = fullBooking.brief?.companySiren ?? undefined;

				const pappers =
					companyName || companySiren
						? await fetchPappersData(companyName, companySiren).catch(() => null)
						: null;

				const aiResult = await generateAiBrief(fullBooking.brief, pappers).catch(() => null);

				if (pappers || aiResult) {
					await db.insert(prospectInsights).values({
						bookingId: booking.id,
						company: pappers?.company ?? null,
						companySiren: pappers?.companySiren ?? null,
						companySector: pappers?.companySector ?? null,
						companySize: pappers?.companySize ?? null,
						aiBrief: aiResult?.aiBrief ?? null,
						aiAngles: aiResult?.aiAngles ?? null,
						aiOpeningQuestion: aiResult?.aiOpeningQuestion ?? null,
						compatibilityScore: aiResult?.compatibilityScore ?? null
					});
				}

				await sendNotificationToFreelance(
					fullBooking,
					notificationEmail ?? undefined,
					preferredLocale as Locale,
					pappers ?? undefined,
					aiResult ?? undefined
				);
			} catch (err) {
				console.error('Post-booking tasks failed for booking', booking.id, err);
			}
		})();

		return { bookingId: booking.id, eventSlug: row.slug };
	}
);

export const rescheduleBooking = command(
	z.object({ token: z.string(), startTime: z.string() }),
	async ({ token, startTime }) => {
		if (await bookingLimiter.isLimited(getRequestEvent())) error(429, 'Too many requests');
		const booking = await db.query.bookings.findFirst({
			where: and(eq(bookings.rescheduleToken, token), ne(bookings.status, 'cancelled')),
			with: { eventType: true, brief: true }
		});

		if (!booking) error(404, 'Booking not found');

		const newStart = new Date(startTime);
		const newEnd = new Date(newStart.getTime() + booking.eventType.duration * 60_000);
		const newToken = crypto.randomUUID();

		const [settingsRow] = await db
			.select({ bufferMinutes: userSettings.bufferMinutes })
			.from(userSettings)
			.where(eq(userSettings.userId, booking.userId));

		await db.transaction(async (tx) => {
			const [conflict] = await tx
				.select({ id: bookings.id })
				.from(bookings)
				.where(
					and(
						eq(bookings.userId, booking.userId),
						ne(bookings.status, 'cancelled'),
						ne(bookings.id, booking.id),
						gt(
							bookings.endTime,
							new Date(newStart.getTime() - (settingsRow?.bufferMinutes ?? 0) * 60_000)
						),
						lt(
							bookings.startTime,
							new Date(newEnd.getTime() + (settingsRow?.bufferMinutes ?? 0) * 60_000)
						)
					)
				)
				.limit(1);

			if (conflict) error(409, 'Slot no longer available');

			await tx
				.update(bookings)
				.set({
					startTime: newStart,
					endTime: newEnd,
					status: 'confirmed',
					rescheduleToken: newToken,
					reminderSentAt: null,
					phoneRevealedAt: null
				})
				.where(eq(bookings.id, booking.id));
		});

		invalidateBusySlotsCache(booking.userId);

		void (async () => {
			try {
				if (booking.googleEventId) {
					await updateCalendarEvent(booking.userId, booking.googleEventId, {
						startTime: newStart,
						endTime: newEnd,
						// re-hide the number until the reveal cron runs again for the new slot
						location:
							booking.eventType.locationType === 'phone'
								? phoneCallPlaceholder(booking.locale as Locale)
								: undefined
					});
				}

				const updated = await db.query.bookings.findFirst({
					where: eq(bookings.id, booking.id),
					with: { eventType: true, brief: true }
				});
				if (!updated) return;

				await sendConfirmationToClient(updated);
			} catch (err) {
				console.error('Post-reschedule tasks failed for booking', booking.id, err);
			}
		})();

		return { bookingId: booking.id };
	}
);

const OUTCOME_STATUS: Record<string, 'cancelled' | 'completed' | null> = {
	declined: 'cancelled',
	ghost: 'cancelled',
	signed: 'completed'
};

export const updateBookingOutcome = command(
	z.object({
		bookingId: z.string().uuid(),
		outcome: z.string(),
		notes: z.string().optional(),
		followupDate: z.string().optional()
	}),
	async (input) => {
		const user = requireAuth();
		const { prospectTracking } = await import('$lib/server/db/schema');

		const booking = await db.query.bookings.findFirst({
			where: and(eq(bookings.id, input.bookingId), eq(bookings.userId, user.id))
		});
		if (!booking) error(404, 'Booking not found');

		// Only "followup" carries a date
		const followupDate =
			input.outcome === 'followup' && input.followupDate ? new Date(input.followupDate) : null;

		// Re-arm the follow-up cron only when the date actually changes — otherwise re-saving an
		// already-notified booking (e.g. editing the notes) would send a duplicate reminder.
		const [existing] = await db
			.select({
				followupDate: prospectTracking.followupDate,
				followupNotifiedAt: prospectTracking.followupNotifiedAt
			})
			.from(prospectTracking)
			.where(eq(prospectTracking.bookingId, booking.id))
			.limit(1);

		const dateChanged =
			(existing?.followupDate?.getTime() ?? null) !== (followupDate?.getTime() ?? null);
		const followupNotifiedAt = dateChanged ? null : (existing?.followupNotifiedAt ?? null);

		await db
			.insert(prospectTracking)
			.values({
				bookingId: booking.id,
				outcome: input.outcome,
				notes: input.notes,
				followupDate,
				followupNotifiedAt
			})
			.onConflictDoUpdate({
				target: prospectTracking.bookingId,
				set: {
					outcome: input.outcome,
					notes: input.notes,
					followupDate,
					followupNotifiedAt,
					updatedAt: new Date()
				}
			});

		const newStatus = OUTCOME_STATUS[input.outcome] ?? null;
		if (newStatus) {
			await db.update(bookings).set({ status: newStatus }).where(eq(bookings.id, booking.id));
			if (newStatus === 'cancelled' && booking.googleEventId) {
				await deleteCalendarEvent(booking.userId, booking.googleEventId).catch(() => null);
			}
		}

		void getAllBookings().refresh();
		void getBookingById({ id: booking.id }).refresh();
		return { ok: true };
	}
);
