import { redirect } from '@sveltejs/kit'
import { auth } from '$lib/server/auth'
import { createOAuth2Client } from '$lib/server/google'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) redirect(303, '/login')

	const oauth2 = createOAuth2Client()
	const state = crypto.randomUUID()

	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10
	})

	const url = oauth2.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent', // always return refresh_token
		scope: ['https://www.googleapis.com/auth/calendar'],
		state
	})

	redirect(303, url)
}
