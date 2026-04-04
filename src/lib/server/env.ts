import { z } from 'zod';
import { env as dynamicPrivateEnv } from '$env/dynamic/private';

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	ORIGIN: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(1),
	APPLE_CLIENT_ID: z.string().optional(),
	APPLE_CLIENT_SECRET: z.string().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().optional().default('onboarding@resend.dev'),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional()
});

export const env = envSchema.parse(dynamicPrivateEnv);
