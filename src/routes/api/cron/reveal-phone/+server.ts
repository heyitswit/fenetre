import { json } from '@sveltejs/kit';
import { verifyCronSecret } from '$lib/server/cron-guard';
import { revealPhoneNumbers } from '$lib/server/cron-handlers';

export async function POST({ request }: { request: Request }) {
	const unauthorized = verifyCronSecret(request);
	if (unauthorized) return unauthorized;
	await revealPhoneNumbers();
	return json({ ok: true });
}
