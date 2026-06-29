import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import type { PortfolioLink } from '$lib/server/db/schema';
import { userSettings } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/remote-helpers';
import { invalidateForUser } from '$lib/server/event-types-cache';
import { locales } from '$lib/paraglide/runtime';
import { isValidTimezone } from '$lib/timezones';
import { loadPublicPortfolioLinks } from '$lib/server/public-queries';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

const DEFAULTS = {
	notificationEmail: null,
	bufferMinutes: 15,
	timezone: 'Europe/Paris',
	preferredLocale: 'fr',
	portfolioLinks: [] as PortfolioLink[],
	googleRefreshToken: null,
	googleCalendarId: 'primary',
	username: ''
};

export const getSettings = query(async () => {
	const user = requireAuth();
	const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
	return row ?? { ...DEFAULTS, userId: user.id };
});

export const getPublicPortfolioLinks = query(
	z.object({ username: z.string() }),
	async ({ username }) => loadPublicPortfolioLinks(username)
);

const PortfolioLinkSchema = z.object({
	missionType: z.string(),
	title: z.string().min(1),
	url: z.url()
});

const RESERVED_USERNAMES = new Set([
	'api',
	'admin',
	'login',
	'register',
	'setup',
	'dashboard',
	'directory',
	'reschedule',
	'static',
	'favicon.ico'
]);

export const updateSettings = command(
	z.object({
		username: z
			.string()
			.min(2)
			.max(64)
			.regex(/^[a-z0-9-]+$/)
			.refine((u) => !RESERVED_USERNAMES.has(u), { message: 'Username is reserved' })
			.optional(),
		notificationEmail: z.string().email().nullable().optional(),
		bufferMinutes: z.number().int().min(0).max(120).optional(),
		timezone: z.string().refine(isValidTimezone, { message: 'Unsupported timezone' }).optional(),
		preferredLocale: z.enum(locales).optional(),
		portfolioLinks: z.array(PortfolioLinkSchema).max(20).optional()
	}),
	async (input) => {
		const user = requireAuth();
		await db
			.insert(userSettings)
			.values({ userId: user.id, username: input.username ?? user.id, ...input })
			.onConflictDoUpdate({ target: userSettings.userId, set: input });
		invalidateForUser(user.id);
		void getSettings().refresh();
		return { ok: true };
	}
);
