import { db } from '$lib/server/db';
import {
	bookings,
	briefs,
	eventTypes,
	prospectInsights,
	prospectTracking,
	userSettings
} from '$lib/server/db/schema';
import { and, eq, gt, gte, inArray, isNotNull, isNull, lt, lte } from 'drizzle-orm';
import {
	sendReminderToClient,
	sendSecondReminderToClient,
	sendPhoneRevealToFreelance,
	sendFollowupToFreelance,
	sendRecoveryToClient
} from '$lib/server/resend';
import { updateCalendarEvent } from '$lib/server/google';
import { phoneCallLocation } from '$lib/server/phone-location';
import type { Locale } from '$lib/paraglide/runtime';

export async function sendReminders(): Promise<void> {
	const tomorrowStart = new Date();
	tomorrowStart.setDate(tomorrowStart.getDate() + 1);
	tomorrowStart.setHours(0, 0, 0, 0);

	const tomorrowEnd = new Date(tomorrowStart);
	tomorrowEnd.setHours(23, 59, 59, 999);

	const upcoming = await db.query.bookings.findMany({
		where: and(
			eq(bookings.status, 'confirmed'),
			isNull(bookings.reminderSentAt),
			gte(bookings.startTime, tomorrowStart),
			lte(bookings.startTime, tomorrowEnd)
		),
		with: { eventType: true, brief: true }
	});

	const results = await Promise.allSettled(
		upcoming.map((booking) => sendReminderToClient(booking))
	);

	const sentIds: string[] = [];
	results.forEach((result, i) => {
		if (result.status === 'fulfilled') {
			sentIds.push(upcoming[i].id);
		} else {
			console.error(`Failed to send reminder for booking ${upcoming[i].id}:`, result.reason);
		}
	});

	if (sentIds.length > 0) {
		await db
			.update(bookings)
			.set({ reminderSentAt: new Date() })
			.where(inArray(bookings.id, sentIds));
	}
}

// Second reminder, ~1h before the meeting. Runs every few minutes; the 75-min window plus the
// secondReminderSentAt guard make it idempotent regardless of when the tick lands.
export async function sendSecondReminders(): Promise<void> {
	const now = new Date();
	const window = new Date(now.getTime() + 75 * 60 * 1000);

	const upcoming = await db.query.bookings.findMany({
		where: and(
			eq(bookings.status, 'confirmed'),
			isNull(bookings.secondReminderSentAt),
			gte(bookings.startTime, now),
			lte(bookings.startTime, window)
		),
		with: { eventType: true, brief: true }
	});

	const results = await Promise.allSettled(
		upcoming.map((booking) => sendSecondReminderToClient(booking))
	);

	const sentIds: string[] = [];
	results.forEach((result, i) => {
		if (result.status === 'fulfilled') {
			sentIds.push(upcoming[i].id);
		} else {
			console.error(`Failed to send 1h reminder for booking ${upcoming[i].id}:`, result.reason);
		}
	});

	if (sentIds.length > 0) {
		await db
			.update(bookings)
			.set({ secondReminderSentAt: new Date() })
			.where(inArray(bookings.id, sentIds));
	}
}

// Email the freelance when a prospect they marked "followup" reaches its due date.
export async function sendFollowupReminders(): Promise<void> {
	const now = new Date();

	const due = await db
		.select({
			bookingId: prospectTracking.bookingId,
			notes: prospectTracking.notes,
			followupDate: prospectTracking.followupDate,
			clientName: bookings.clientName,
			clientEmail: bookings.clientEmail,
			eventTypeName: eventTypes.name,
			startTime: bookings.startTime,
			rescheduleToken: bookings.rescheduleToken,
			company: prospectInsights.company,
			notificationEmail: userSettings.notificationEmail,
			preferredLocale: userSettings.preferredLocale
		})
		.from(prospectTracking)
		.innerJoin(bookings, eq(prospectTracking.bookingId, bookings.id))
		.innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
		.leftJoin(prospectInsights, eq(prospectInsights.bookingId, bookings.id))
		.leftJoin(userSettings, eq(userSettings.userId, bookings.userId))
		.where(
			and(
				eq(prospectTracking.outcome, 'followup'),
				isNull(prospectTracking.followupNotifiedAt),
				isNotNull(prospectTracking.followupDate),
				lte(prospectTracking.followupDate, now)
			)
		);

	for (const f of due) {
		try {
			await sendFollowupToFreelance({
				clientName: f.clientName,
				clientEmail: f.clientEmail,
				company: f.company,
				eventTypeName: f.eventTypeName,
				originalDate: f.startTime,
				notes: f.notes,
				bookingId: f.bookingId,
				notificationEmail: f.notificationEmail ?? undefined,
				locale: (f.preferredLocale as Locale) ?? 'fr'
			});

			await db
				.update(prospectTracking)
				.set({ followupNotifiedAt: new Date() })
				.where(eq(prospectTracking.bookingId, f.bookingId));
		} catch (err) {
			console.error(`Failed to send followup reminder for booking ${f.bookingId}:`, err);
		}
	}
}

// Nudge clients who started a brief but never picked a slot — once, between 1h and 48h after.
export async function recoverAbandonedBriefs(): Promise<void> {
	const now = new Date();
	const minAge = new Date(now.getTime() - 60 * 60 * 1000);
	const maxAge = new Date(now.getTime() - 48 * 60 * 60 * 1000);

	const candidates = await db
		.select({
			briefId: briefs.id,
			clientEmail: briefs.clientEmail,
			username: userSettings.username,
			preferredLocale: userSettings.preferredLocale
		})
		.from(briefs)
		.innerJoin(userSettings, eq(briefs.userId, userSettings.userId))
		.where(
			and(
				isNull(briefs.bookingId),
				isNull(briefs.recoverySentAt),
				eq(briefs.isAbandoned, false),
				lt(briefs.createdAt, minAge),
				gt(briefs.createdAt, maxAge),
				isNotNull(briefs.projectDescription)
			)
		);

	for (const c of candidates) {
		try {
			await sendRecoveryToClient({
				clientEmail: c.clientEmail,
				username: c.username,
				locale: (c.preferredLocale as Locale) ?? 'fr'
			});

			await db.update(briefs).set({ recoverySentAt: new Date() }).where(eq(briefs.id, c.briefId));
		} catch (err) {
			console.error(`Failed to send recovery for brief ${c.briefId}:`, err);
		}
	}
}

export async function markCompleted(): Promise<void> {
	await db
		.update(bookings)
		.set({ status: 'completed' })
		.where(and(eq(bookings.status, 'confirmed'), lt(bookings.endTime, new Date())));
}

// Reveal the client's phone number to the freelance ~30 min before a phone call:
// email + inject the number into the calendar event. Runs frequently (every few min).
export async function revealPhoneNumbers(): Promise<void> {
	const now = new Date();
	const threshold = new Date(now.getTime() + 30 * 60 * 1000);

	const upcoming = await db.query.bookings.findMany({
		where: and(
			eq(bookings.status, 'confirmed'),
			isNull(bookings.phoneRevealedAt),
			gte(bookings.startTime, now),
			lte(bookings.startTime, threshold)
		),
		with: { eventType: true, brief: true }
	});

	const phoneBookings = upcoming.filter(
		(b) => b.eventType.locationType === 'phone' && b.clientPhone
	);

	for (const booking of phoneBookings) {
		try {
			const [settings] = await db
				.select({
					notificationEmail: userSettings.notificationEmail,
					preferredLocale: userSettings.preferredLocale
				})
				.from(userSettings)
				.where(eq(userSettings.userId, booking.userId));

			await sendPhoneRevealToFreelance(
				booking,
				settings?.notificationEmail ?? undefined,
				settings?.preferredLocale as Locale | undefined
			);

			if (booking.googleEventId) {
				await updateCalendarEvent(booking.userId, booking.googleEventId, {
					location: phoneCallLocation(booking.clientPhone!, booking.locale as Locale)
				});
			}

			await db
				.update(bookings)
				.set({ phoneRevealedAt: new Date() })
				.where(eq(bookings.id, booking.id));
		} catch (err) {
			console.error(`Failed to reveal phone for booking ${booking.id}:`, err);
		}
	}
}

export async function checkAbandoned(): Promise<void> {
	const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

	await db
		.update(briefs)
		.set({ isAbandoned: true })
		.where(
			and(isNull(briefs.bookingId), eq(briefs.isAbandoned, false), lt(briefs.createdAt, cutoff))
		);
}
