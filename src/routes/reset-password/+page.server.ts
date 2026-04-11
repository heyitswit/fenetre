import { redirectIfLoggedIn } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	await redirectIfLoggedIn(request);
};
