import { json } from '@sveltejs/kit';
import { verifyCronSecret } from '$lib/server/cron-guard';
import { checkAbandoned, recoverAbandonedBriefs } from '$lib/server/cron-handlers';

export async function POST({ request }: { request: Request }) {
	const unauthorized = verifyCronSecret(request);
	if (unauthorized) return unauthorized;
	// Recover first (while briefs are still flagged active), then mark the older ones abandoned
	await recoverAbandonedBriefs();
	await checkAbandoned();
	return json({ ok: true });
}
