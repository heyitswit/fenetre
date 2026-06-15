import { env as dynamicPrivateEnv } from '$env/dynamic/private';
import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.url(),
	ORIGIN: z.url(),
	BETTER_AUTH_SECRET: z.string().min(1),
	// Social providers (optional — used for Google Calendar OAuth and login)
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GITHUB_CLIENT_ID: z.string().optional(),
	GITHUB_CLIENT_SECRET: z.string().optional(),
	// Google Calendar ID fallback (overridden per-user via admin settings)
	GOOGLE_CALENDAR_ID: z.string().optional().default('primary'),
	// Resend
	RESEND_API_KEY: z.string().optional(),
	RESEND_FROM_EMAIL: z.string().optional().default('onboarding@resend.dev'),
	// Cron — required in prod; generate with: openssl rand -hex 32
	CRON_SECRET: z.string().optional(),
	// Set to 'true' to allow public registration (admin controls it otherwise)
	REGISTRATION_OPEN: z.string().optional().default('false'),
	// Pappers — French company enrichment (optional)
	PAPPERS_API_KEY: z.string().optional(),
	// OpenAI — AI brief generation (optional)
	OPENAI_API_KEY: z.string().optional(),
	OPENAI_URL: z.string().optional(),
	OPENAI_MODEL: z.string().optional().default('gpt-4o-mini')
});

export const env = envSchema
	.superRefine((data, ctx) => {
		if (
			process.env.NODE_ENV === 'production' &&
			(!data.CRON_SECRET || data.CRON_SECRET.length < 16)
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['CRON_SECRET'],
				message: 'Required in production (>=16 chars) — generate with: openssl rand -hex 32'
			});
		}
	})
	.parse(dynamicPrivateEnv);
