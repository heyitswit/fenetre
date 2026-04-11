import { json } from '@sveltejs/kit';
import { env } from '$lib/server/env';

export function verifyCronSecret(request: Request): Response | null {
	if (request.headers.get('x-cron-secret') !== env.CRON_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}
