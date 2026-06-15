import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eventTypes } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/remote-helpers';
import { invalidateForUser } from '$lib/server/event-types-cache';
import { loadActiveEventTypes, loadEventTypeBySlug } from '$lib/server/public-queries';
import { and, asc, eq } from 'drizzle-orm';
import * as z from 'zod';

const FormFieldOptionSchema = z.object({ value: z.string().min(1), label: z.string().min(1) });
const FormFieldSchema = z.object({
	key: z.string().min(1),
	label: z.string().min(1),
	type: z.enum(['text', 'textarea', 'radio', 'select']),
	options: z.array(FormFieldOptionSchema).optional(),
	required: z.boolean().optional(),
	enabled: z.boolean(),
	placeholder: z.string().optional()
});

export const getActiveEventTypes = query(
	z.object({ username: z.string() }),
	async ({ username }) => loadActiveEventTypes(username)
);

export const getEventTypeBySlug = query(
	z.object({ username: z.string(), slug: z.string() }),
	async ({ username, slug }) => loadEventTypeBySlug(username, slug)
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
		sortOrder: z.number().int().optional(),
		formFields: z.array(FormFieldSchema).optional()
	}),
	async (input) => {
		const user = requireAuth();
		const [et] = await db
			.insert(eventTypes)
			.values({ ...input, userId: user.id })
			.returning();
		invalidateForUser(user.id);
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
		sortOrder: z.number().int().optional(),
		formFields: z.array(FormFieldSchema).nullable().optional()
	}),
	async ({ id, ...patch }) => {
		const user = requireAuth();
		const [et] = await db
			.update(eventTypes)
			.set(patch)
			.where(and(eq(eventTypes.id, id), eq(eventTypes.userId, user.id)))
			.returning();
		if (!et) error(404, 'Event type not found');
		invalidateForUser(user.id);
		void getAllEventTypes().refresh();
		return et;
	}
);

export const setBusyModeAll = command(
	z.object({ isBusyMode: z.boolean() }),
	async ({ isBusyMode }) => {
		const user = requireAuth();
		await db.update(eventTypes).set({ isBusyMode }).where(eq(eventTypes.userId, user.id));
		invalidateForUser(user.id);
		void getAllEventTypes().refresh();
		return { ok: true };
	}
);
