import { redirect } from '@sveltejs/kit';
import { createOAuth2Client } from '$lib/server/google';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url, cookies }) => {
	if (!locals.user) redirect(303, '/login');

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');

	cookies.delete('google_oauth_state', { path: '/' });

	if (!code || !state || state !== storedState) {
		redirect(303, '/admin/settings?error=oauth_invalid_state');
	}

	const oauth2 = createOAuth2Client();
	const { tokens } = await oauth2.getToken(code);

	if (!tokens.refresh_token) {
		redirect(303, '/admin/settings?error=no_refresh_token');
	}

	await db
		.insert(userSettings)
		.values({
			userId: locals.user.id,
			username: locals.user.id, // placeholder if not set yet
			googleRefreshToken: tokens.refresh_token,
			googleCalendarId: 'primary'
		})
		.onConflictDoUpdate({
			target: userSettings.userId,
			set: { googleRefreshToken: tokens.refresh_token }
		});

	redirect(303, '/admin/settings?connected=1');
};
