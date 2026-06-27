import cron from 'node-cron';

const APP_URL = process.env.PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!APP_URL || !CRON_SECRET) {
	throw new Error('PUBLIC_APP_URL and CRON_SECRET are required');
}

async function callEndpoint(path: string) {
	try {
		const res = await fetch(`${APP_URL}${path}`, {
			method: 'POST',
			headers: { 'x-cron-secret': CRON_SECRET! }
		});
		if (!res.ok) {
			console.error(`[cron] ${path} → ${res.status}`);
		} else {
			console.log(`[cron] ${path} → OK`);
		}
	} catch (err) {
		console.error(`[cron] ${path} → network error`, err);
	}
}

// 24h reminders — daily at 08:00
cron.schedule('0 8 * * *', () => {
	callEndpoint('/api/cron/send-reminders');
});

// Reveal client phone numbers ~30 min before phone calls — every 5 min
cron.schedule('*/5 * * * *', () => {
	callEndpoint('/api/cron/reveal-phone');
});

// Mark past bookings as completed — every hour
cron.schedule('0 * * * *', () => {
	callEndpoint('/api/cron/mark-completed');
});

// Check abandoned briefs — every 6h
cron.schedule('0 */6 * * *', () => {
	callEndpoint('/api/cron/check-abandoned');
});

console.log('[cron] started — waiting for next triggers');
