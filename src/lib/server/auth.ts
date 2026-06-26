import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { admin, lastLoginMethod } from 'better-auth/plugins';
import {
	ac,
	admin as adminRole,
	superadmin as superadminRole,
	user as userRole
} from '$lib/server/permissions';
import { env } from '$lib/server/env';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import argon2 from 'argon2';
import { sendPasswordReset } from '$lib/server/resend';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		password: {
			hash: (password) => argon2.hash(password, { type: argon2.argon2id }),
			verify: ({ hash, password }) => argon2.verify(hash, password)
		},
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordReset(user.email, url);
		}
	},
	socialProviders: {},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 10,
		storage: 'memory'
	},
	advanced: {
		ipAddress: {
			ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for']
		}
	},
	plugins: [
		admin({
			ac,
			roles: { user: userRole, admin: adminRole, superadmin: superadminRole },
			adminRoles: ['admin', 'superadmin'],
			defaultRole: 'user'
		}),
		lastLoginMethod(),
		sveltekitCookies(getRequestEvent)
	]
});
