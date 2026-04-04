import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink, lastLoginMethod } from 'better-auth/plugins';
import { stripe } from "@better-auth/stripe";
import { env } from '$lib/server/env';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { Resend } from 'resend';
import Stripe from 'stripe';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_123");

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	socialProviders: {
		apple: (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) ? {
			clientId: env.APPLE_CLIENT_ID,
			clientSecret: env.APPLE_CLIENT_SECRET
		} : undefined,
		google: (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) ? {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		} : undefined
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, token, url }, request) => {
				if (!resend) {
					console.warn('Resend API key missing, cannot send magic link');
					return;
				}
				await resend.emails.send({
					from: env.EMAIL_FROM,
					to: email,
					subject: 'Login to our app',
					html: `<a href="${url}">Click here to login</a>`
				});
			}
		}),
		lastLoginMethod(),
		stripe({
			stripeClient,
			stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || "whsec_123",
			createCustomerOnSignUp: true,
		}),
		sveltekitCookies(getRequestEvent)
	].filter(Boolean) as any // Filter out undefined plugins
});
