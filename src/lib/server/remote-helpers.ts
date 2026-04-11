import { getRequestEvent } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export function requireAuth() {
	const { locals } = getRequestEvent();
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}

export async function userIdByUsername(username: string): Promise<string> {
	const [row] = await db
		.select({ userId: userSettings.userId })
		.from(userSettings)
		.where(eq(userSettings.username, username));
	if (!row) error(404, 'User not found');
	return row.userId;
}
