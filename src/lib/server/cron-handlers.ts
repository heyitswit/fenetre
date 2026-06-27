import { db } from '$lib/server/db';
import { bookings, briefs, userSettings } from '$lib/server/db/schema';
import { and, eq, gte, inArray, isNull, lt, lte } from 'drizzle-orm';
import { sendReminderToClient, sendPhoneRevealToFreelance } from '$lib/server/resend';
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
