import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { availability, bookings, eventTypes, user, userSettings } from '$lib/server/db/schema';
import {
	getBySlug,
	setBySlug,
	getActive,
	setActive,
	getAvailability,
	setAvailability
} from '$lib/server/event-types-cache';
import { getBusySlots } from '$lib/server/google';
import { and, asc, eq, getTableColumns, gte, ne } from 'drizzle-orm';

const DAYS_AHEAD = 30;

export async function loadActiveEventTypes(username: string) {
	type R = Awaited<ReturnType<typeof fetchActive>>;
	const cached = getActive<R>(username);
	if (cached) return cached;

	const rows = await fetchActive(username);
	if (rows.length > 0) setActive(username, rows[0].userId, rows);
	return rows;
}

// Resolve + cache the event type with everything the booking flow needs:
// display columns, host name, and the owner's buffer. Shared by the public
// event-type query and the slot computation so a single page render resolves
// it once instead of issuing two near-identical joins.
async function resolveEventType(username: string, slug: string) {
	type R = Awaited<ReturnType<typeof fetchBySlug>>;
	const cached = getBySlug<R>(username, slug);
	if (cached !== null) return cached;

	const et = await fetchBySlug(username, slug);
	if (et) setBySlug(username, slug, et.userId, et);
	return et;
}

export async function loadEventTypeBySlug(username: string, slug: string) {
	const et = await resolveEventType(username, slug);
	if (!et) return null;
	// bufferMinutes is an internal scheduling detail — keep it out of the
	// publicly-returned event type so the contract is unchanged.
	const { bufferMinutes: _bufferMinutes, ...publicEventType } = et;
	return publicEventType;
}

export async function loadAvailableSlots(
	username: string,
	eventTypeSlug: string
): Promise<Record<string, { start: string; end: string }[]>> {
	const row = await resolveEventType(username, eventTypeSlug);
	if (!row) return {};

	const { userId, bufferMinutes } = row;

	const now = new Date();
	const horizon = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

	type AvailRow = typeof availability.$inferSelect;
	const cachedAvail = getAvailability<AvailRow[]>(userId);
	const availPromise = cachedAvail
		? Promise.resolve(cachedAvail)
		: db
				.select()
				.from(availability)
				.where(and(eq(availability.userId, userId), eq(availability.isActive, true)));

	const [availabilityRows, existingBookings, busySlots] = await Promise.all([
		availPromise,
		db
			.select()
			.from(bookings)
			.where(
				and(eq(bookings.userId, userId), gte(bookings.startTime, now), ne(bookings.status, 'cancelled'))
			),
		getBusySlots(userId, now, horizon)
	]);

	if (!cachedAvail) setAvailability(userId, availabilityRows);

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

		while (cursor.getTime() + row.duration * 60_000 <= dayEnd.getTime()) {
			const slotStart = new Date(cursor);
			const slotEnd = new Date(cursor.getTime() + row.duration * 60_000);

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

			cursor.setMinutes(cursor.getMinutes() + row.duration);
		}

		if (slots[dateKey].length === 0) delete slots[dateKey];
	}

	return slots;
}

export async function loadBookingConfirmation(id: string) {
	const booking = await db.query.bookings.findFirst({
		where: eq(bookings.id, id),
		with: { eventType: true, brief: true }
	});
	if (!booking) error(404, 'Booking not found');
	return {
		id: booking.id,
		clientName: booking.clientName,
		startTime: booking.startTime.toISOString(),
		endTime: booking.endTime.toISOString(),
		meetLink: booking.meetLink,
		missionType: booking.brief?.missionType ?? null,
		eventType: { name: booking.eventType.name, duration: booking.eventType.duration }
	};
}

export async function loadPublicPortfolioLinks(username: string) {
	const [row] = await db
		.select({ portfolioLinks: userSettings.portfolioLinks })
		.from(userSettings)
		.where(eq(userSettings.username, username));
	return row?.portfolioLinks ?? [];
}

export async function loadBookingByToken(token: string) {
	// Single round-trip: join the event type and the owner's username instead of
	// fetching the booking first and then its username in a second query.
	const [row] = await db
		.select({
			booking: getTableColumns(bookings),
			eventType: getTableColumns(eventTypes),
			username: userSettings.username
		})
		.from(bookings)
		.innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
		.leftJoin(userSettings, eq(userSettings.userId, bookings.userId))
		.where(and(eq(bookings.rescheduleToken, token), ne(bookings.status, 'cancelled')))
		.limit(1);

	if (!row) error(404, 'Booking not found');

	return { ...row.booking, eventType: row.eventType, username: row.username ?? null };
}

async function fetchBySlug(username: string, slug: string) {
	const [et] = await db
		.select({
			...getTableColumns(eventTypes),
			hostName: user.name,
			bufferMinutes: userSettings.bufferMinutes
		})
		.from(eventTypes)
		.innerJoin(userSettings, eq(eventTypes.userId, userSettings.userId))
		.innerJoin(user, eq(user.id, userSettings.userId))
		.where(and(eq(userSettings.username, username), eq(eventTypes.slug, slug)))
		.limit(1);
	return et ?? null;
}

async function fetchActive(username: string) {
	return db
		.select(getTableColumns(eventTypes))
		.from(eventTypes)
		.innerJoin(userSettings, eq(eventTypes.userId, userSettings.userId))
		.where(and(eq(userSettings.username, username), eq(eventTypes.isActive, true)))
		.orderBy(asc(eventTypes.sortOrder));
}
