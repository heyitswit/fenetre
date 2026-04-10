import { db } from '$lib/server/db'
import { bookings, briefs } from '$lib/server/db/schema'
import { and, eq, gte, isNull, lt, lte } from 'drizzle-orm'
import { sendReminderToClient } from '$lib/server/resend'

export async function sendReminders(): Promise<void> {
	const tomorrowStart = new Date()
	tomorrowStart.setDate(tomorrowStart.getDate() + 1)
	tomorrowStart.setHours(0, 0, 0, 0)

	const tomorrowEnd = new Date(tomorrowStart)
	tomorrowEnd.setHours(23, 59, 59, 999)

	const upcoming = await db.query.bookings.findMany({
		where: and(
			eq(bookings.status, 'confirmed'),
			isNull(bookings.reminderSentAt),
			gte(bookings.startTime, tomorrowStart),
			lte(bookings.startTime, tomorrowEnd)
		),
		with: { eventType: true, brief: true }
	})

	const results = await Promise.allSettled(
		upcoming.map(async (booking) => {
			await sendReminderToClient(booking)
			await db
				.update(bookings)
				.set({ reminderSentAt: new Date() })
				.where(eq(bookings.id, booking.id))
		})
	)

	results.forEach((result, i) => {
		if (result.status === 'rejected') {
			console.error(`Failed to send reminder for booking ${upcoming[i].id}:`, result.reason)
		}
	})
}

export async function markCompleted(): Promise<void> {
	await db
		.update(bookings)
		.set({ status: 'completed' })
		.where(and(eq(bookings.status, 'confirmed'), lt(bookings.endTime, new Date())))
}

export async function checkAbandoned(): Promise<void> {
	const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

	await db
		.update(briefs)
		.set({ isAbandoned: true })
		.where(and(isNull(briefs.bookingId), eq(briefs.isAbandoned, false), lt(briefs.createdAt, cutoff)))
}
