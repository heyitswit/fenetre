import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getSessionCookie } from 'better-auth/cookies';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { env } from '$lib/server/env';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleRegistrationGuard: Handle = async ({ event, resolve }) => {
	const isSignUp =
		event.url.pathname === '/api/auth/sign-up/email' && event.request.method === 'POST';

	if (isSignUp && env.REGISTRATION_OPEN !== 'true') {
		const [row] = await db.select({ id: user.id }).from(user).limit(1);
		if (row) {
			return new Response(
				JSON.stringify({ message: 'Registration is closed. Contact an admin.' }),
				{ status: 403, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}

	return resolve(event);
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (getSessionCookie(event.request)) {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleParaglide, handleRegistrationGuard, handleBetterAuth);
