import { loadEventTypeBySlug, loadAvailableSlots } from '$lib/server/public-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { username, eventSlug } = params;
	const eventType = await loadEventTypeBySlug(username, eventSlug);
	const slots = eventType ? await loadAvailableSlots(username, eventSlug) : {};
	return { eventType, slots };
};
