import { loadEventTypeBySlug, loadAvailableSlots } from '$lib/server/public-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { username, eventSlug } = params;
	// Resolve the event type first so the (cached) lookup is shared: the slot
	// computation reuses it instead of re-running the same join.
	const eventType = await loadEventTypeBySlug(username, eventSlug);
	const slots = eventType ? await loadAvailableSlots(username, eventSlug) : {};
	return { eventType, slots };
};
