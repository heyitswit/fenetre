import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eventTypes } from '$lib/server/db/schema';
import { requireAuth, userIdByUsername } from '$lib/server/remote-helpers';
import { and, asc, eq } from 'drizzle-orm';
import * as z from 'zod';

export const getActiveEventTypes = query(
	z.object({ username: z.string() }),
	async ({ username }) => {
		const userId = await userIdByUsername(username);
		return db
			.select()
			.from(eventTypes)
			.where(and(eq(eventTypes.userId, userId), eq(eventTypes.isActive, true)))
			.orderBy(asc(eventTypes.sortOrder));
	}
);

export const getEventTypeBySlug = query(
	z.object({ username: z.string(), slug: z.string() }),
	async ({ username, slug }) => {
		const userId = await userIdByUsername(username);
		const [et] = await db
			.select()
			.from(eventTypes)
			.where(and(eq(eventTypes.userId, userId), eq(eventTypes.slug, slug)))
			.limit(1);
		return et ?? null;
	}
);

export const getAllEventTypes = query(async () => {
	const user = requireAuth();
	return db
		.select()
		.from(eventTypes)
		.where(eq(eventTypes.userId, user.id))
		.orderBy(asc(eventTypes.sortOrder));
});

export const createEventType = command(
	z.object({
		slug: z.string().min(1),
		name: z.string().min(1),
		description: z.string().optional(),
		duration: z.number().int().positive(),
		color: z.string().optional(),
		sortOrder: z.number().int().optional()
	}),
	async (input) => {
		const user = requireAuth();
		const [et] = await db
			.insert(eventTypes)
			.values({ ...input, userId: user.id })
			.returning();
		void getAllEventTypes().refresh();
		return et;
	}
);

export const updateEventType = command(
	z.object({
		id: z.string().uuid(),
		slug: z.string().min(1).optional(),
		name: z.string().min(1).optional(),
		description: z.string().optional(),
		duration: z.number().int().positive().optional(),
		isActive: z.boolean().optional(),
		isBusyMode: z.boolean().optional(),
		color: z.string().optional(),
		sortOrder: z.number().int().optional()
	}),
	async ({ id, ...patch }) => {
		const user = requireAuth();
		const [et] = await db
			.update(eventTypes)
			.set(patch)
			.where(and(eq(eventTypes.id, id), eq(eventTypes.userId, user.id)))
			.returning();
		if (!et) error(404, 'Event type not found');
		void getAllEventTypes().refresh();
		return et;
	}
);

export const setBusyModeAll = command(
	z.object({ isBusyMode: z.boolean() }),
	async ({ isBusyMode }) => {
		const user = requireAuth();
		await db.update(eventTypes).set({ isBusyMode }).where(eq(eventTypes.userId, user.id));
		void getAllEventTypes().refresh();
		return { ok: true };
	}
);
