import { json } from '@sveltejs/kit';
import { verifyCronSecret } from '$lib/server/cron-guard';
import { markCompleted } from '$lib/server/cron-handlers';

export async function POST({ request }: { request: Request }) {
	const unauthorized = verifyCronSecret(request);
	if (unauthorized) return unauthorized;
	await markCompleted();
	return json({ ok: true });
}
