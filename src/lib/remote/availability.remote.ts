import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { availability, bookings, eventTypes, userSettings } from '$lib/server/db/schema';
import { and, eq, gte, ne } from 'drizzle-orm';
import { getBusySlots } from '$lib/server/google';
import { requireAuth } from '$lib/server/remote-helpers';
import * as z from 'zod';

const DAYS_AHEAD = 30;

export const getAvailableSlots = query(
	z.object({ username: z.string(), eventTypeSlug: z.string() }),
	async ({ username, eventTypeSlug }) => {
		const [settingsRow] = await db
			.select({ userId: userSettings.userId, bufferMinutes: userSettings.bufferMinutes })
			.from(userSettings)
			.where(eq(userSettings.username, username));

		if (!settingsRow) return {};

		const { userId, bufferMinutes } = settingsRow;

		const [eventType] = await db
			.select()
			.from(eventTypes)
			.where(and(eq(eventTypes.userId, userId), eq(eventTypes.slug, eventTypeSlug)))
			.limit(1);

		if (!eventType) return {};

		const now = new Date();
		const horizon = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

		const [availabilityRows, existingBookings, busySlots] = await Promise.all([
			db
				.select()
				.from(availability)
				.where(and(eq(availability.userId, userId), eq(availability.isActive, true))),
			db
				.select()
				.from(bookings)
				.where(
					and(
						eq(bookings.userId, userId),
						gte(bookings.startTime, now),
						ne(bookings.status, 'cancelled')
					)
				),
			getBusySlots(userId, now, horizon)
		]);

		const slots: Record<string, { start: string; end: string }[]> = {};

		for (let d = new Date(now); d <= horizon; d.setDate(d.getDate() + 1)) {
			const dayOfWeek = d.getDay();
			const rule = availabilityRows.find((a) => a.dayOfWeek === dayOfWeek);
			if (!rule) continue;

			const [startHour, startMin] = rule.startTime.split(':').map(Number);
			const [endHour, endMin] = rule.endTime.split(':').map(Number);

			const dayStart = new Date(d);
			dayStart.setHours(startHour, startMin, 0, 0);
			const dayEnd = new Date(d);
			dayEnd.setHours(endHour, endMin, 0, 0);

			const cursor = new Date(dayStart);
			const dateKey = d.toISOString().slice(0, 10);
			slots[dateKey] = [];

			while (cursor.getTime() + eventType.duration * 60_000 <= dayEnd.getTime()) {
				const slotStart = new Date(cursor);
				const slotEnd = new Date(cursor.getTime() + eventType.duration * 60_000);

				const blocked =
					slotStart < now ||
					existingBookings.some((b) => {
						const bufStart = new Date(b.startTime.getTime() - bufferMinutes * 60_000);
						const bufEnd = new Date(b.endTime.getTime() + bufferMinutes * 60_000);
						return slotStart < bufEnd && slotEnd > bufStart;
					}) ||
					busySlots.some((b) => {
						const bufStart = new Date(new Date(b.start).getTime() - bufferMinutes * 60_000);
						const bufEnd = new Date(new Date(b.end).getTime() + bufferMinutes * 60_000);
						return slotStart < bufEnd && slotEnd > bufStart;
					});

				if (!blocked) {
					slots[dateKey].push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
				}

				cursor.setMinutes(cursor.getMinutes() + eventType.duration);
			}

			if (slots[dateKey].length === 0) delete slots[dateKey];
		}

		return slots;
	}
);

export const getAllAvailability = query(async () => {
	const user = requireAuth();
	return db
		.select()
		.from(availability)
		.where(eq(availability.userId, user.id))
		.orderBy(availability.dayOfWeek);
});

const AvailabilityRow = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	startTime: z.string(),
	endTime: z.string(),
	isActive: z.boolean()
});

export const saveAvailability = command(z.array(AvailabilityRow), async (rows) => {
	const user = requireAuth();
	await db.delete(availability).where(eq(availability.userId, user.id));
	if (rows.length > 0) {
		await db.insert(availability).values(rows.map((r) => ({ ...r, userId: user.id })));
	}
	void getAllAvailability().refresh();
	return { ok: true };
});
