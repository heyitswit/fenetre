import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { availability } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { invalidateAvailability } from '$lib/server/event-types-cache';
import { loadAvailableSlots } from '$lib/server/public-queries';
import { requireAuth } from '$lib/server/remote-helpers';
import * as z from 'zod';

export const getAvailableSlots = query(
	z.object({ username: z.string(), eventTypeSlug: z.string() }),
	async ({ username, eventTypeSlug }) => loadAvailableSlots(username, eventTypeSlug)
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
	invalidateAvailability(user.id);
	void getAllAvailability().refresh();
	return { ok: true };
});
