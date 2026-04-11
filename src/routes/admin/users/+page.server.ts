import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) redirect(303, '/login');
	const role = session.user.role;
	if (role !== 'admin' && role !== 'superadmin') redirect(303, '/admin');
};
