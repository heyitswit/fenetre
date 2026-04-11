import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export async function redirectIfLoggedIn(request: Request): Promise<void> {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) redirect(303, '/admin');
}
