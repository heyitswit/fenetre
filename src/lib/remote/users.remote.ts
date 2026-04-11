import { query, command, getRequestEvent } from '$app/server';
import { env } from '$lib/server/env';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, userSettings } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { requireAuth } from '$lib/server/remote-helpers';
import { ne, eq } from 'drizzle-orm';
import * as z from 'zod';

function requireAdmin() {
	const me = requireAuth();
	if (me.role !== 'admin' && me.role !== 'superadmin') redirect(303, '/');
	return me;
}

function getHeaders() {
	return getRequestEvent().request.headers;
}

export const getAllUsernames = query(async () => {
	return db
		.select({ username: userSettings.username, name: user.name })
		.from(userSettings)
		.innerJoin(user, eq(userSettings.userId, user.id));
});

export const getUserName = query(z.object({ username: z.string() }), async ({ username }) => {
	const [row] = await db
		.select({ name: user.name })
		.from(userSettings)
		.innerJoin(user, eq(userSettings.userId, user.id))
		.where(eq(userSettings.username, username));
	return row?.name ?? null;
});

export const getRegistrationOpen = query(async () => {
	return env.REGISTRATION_OPEN === 'true';
});

export const getHasUsers = query(async () => {
	const [row] = await db.select({ id: user.id }).from(user).limit(1);
	return !!row;
});

export const getAllUsers = query(async () => {
	const me = requireAdmin();
	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			banned: user.banned,
			banReason: user.banReason,
			createdAt: user.createdAt
		})
		.from(user)
		.where(ne(user.id, me.id));
});

export const createUser = command(
	z.object({
		name: z.string().min(1),
		email: z.email(),
		password: z.string().min(8)
	}),
	async ({ name, email, password }) => {
		requireAdmin();
		await auth.api.createUser({ body: { name, email, password, role: 'user' } });
		return { ok: true };
	}
);

export const deleteUser = command(z.object({ userId: z.string() }), async ({ userId }) => {
	const me = requireAdmin();
	if (userId === me.id) throw new Error('Cannot delete your own account');
	const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
	if (!target) throw new Error('User not found');
	if ((target.role === 'admin' || target.role === 'superadmin') && me.role !== 'superadmin') {
		throw new Error('Only superadmin can delete admins');
	}
	await db.delete(user).where(eq(user.id, userId));
	return { ok: true };
});

export const banUser = command(
	z.object({ userId: z.string(), reason: z.string().optional() }),
	async ({ userId, reason }) => {
		const me = requireAdmin();
		const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
		if (!target) throw new Error('User not found');
		if ((target.role === 'admin' || target.role === 'superadmin') && me.role !== 'superadmin') {
			throw new Error('Only superadmin can ban admins');
		}
		await auth.api.banUser({
			body: { userId, banReason: reason },
			headers: getHeaders()
		});
		return { ok: true };
	}
);

export const unbanUser = command(z.object({ userId: z.string() }), async ({ userId }) => {
	requireAdmin();
	await auth.api.unbanUser({ body: { userId }, headers: getHeaders() });
	return { ok: true };
});

export const setRole = command(
	z.object({ userId: z.string(), role: z.enum(['user', 'admin', 'superadmin']) }),
	async ({ userId, role }) => {
		const me = requireAdmin();
		if ((role === 'admin' || role === 'superadmin') && me.role !== 'superadmin') {
			throw new Error('Only superadmin can promote to admin');
		}
		await auth.api.setRole({
			body: { userId, role: role as 'user' | 'admin' },
			headers: getHeaders()
		});
		return { ok: true };
	}
);

export const revokeUserSessions = command(z.object({ userId: z.string() }), async ({ userId }) => {
	const me = requireAdmin();
	const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
	if (!target) throw new Error('User not found');
	if ((target.role === 'admin' || target.role === 'superadmin') && me.role !== 'superadmin') {
		throw new Error('Only superadmin can revoke admin sessions');
	}
	await auth.api.revokeUserSessions({ body: { userId }, headers: getHeaders() });
	return { ok: true };
});
