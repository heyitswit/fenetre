import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userSettings, eventTypes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const settings = await db
		.select({ userId: userSettings.userId })
		.from(userSettings)
		.where(eq(userSettings.username, params.username))
		.limit(1);

	if (!settings.length) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const types = await db
		.select({
			slug: eventTypes.slug,
			name: eventTypes.name,
			description: eventTypes.description,
			duration: eventTypes.duration,
			color: eventTypes.color
		})
		.from(eventTypes)
		.where(and(eq(eventTypes.userId, settings[0].userId), eq(eventTypes.isActive, true)))
		.orderBy(eventTypes.sortOrder);

	return json(types, {
		headers: { 'Access-Control-Allow-Origin': '*' }
	});
};

export async function OPTIONS() {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
