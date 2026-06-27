import { google } from 'googleapis';
import { redirect } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export function createOAuth2Client() {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		redirect(303, '/admin/settings?error=google_not_configured');
	}
	return new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		`${env.ORIGIN}/api/google/callback`
	);
}

interface CachedCreds {
	refreshToken: string;
	calendarId: string;
	expiresAt: number;
}
const credsCache = new Map<string, CachedCreds>();

async function getCalendarClient(userId: string) {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
	}

	let creds = credsCache.get(userId);
	if (!creds || creds.expiresAt <= Date.now()) {
		const [row] = await db
			.select({
				googleRefreshToken: userSettings.googleRefreshToken,
				googleCalendarId: userSettings.googleCalendarId
			})
			.from(userSettings)
			.where(eq(userSettings.userId, userId));

		if (!row?.googleRefreshToken) {
			throw new Error(`Google Calendar not connected. Go to /admin/settings to connect.`);
		}

		creds = {
			refreshToken: row.googleRefreshToken,
			calendarId: row.googleCalendarId,
			expiresAt: Date.now() + 5 * 60 * 1000
		};
		credsCache.set(userId, creds);
	}

	const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
	auth.setCredentials({ refresh_token: creds.refreshToken });

	return {
		calendar: google.calendar({ version: 'v3', auth }),
		calendarId: creds.calendarId
	};
}

export interface BusySlot {
	start: string;
	end: string;
}

interface CachedBusy {
	slots: BusySlot[];
	expiresAt: number;
}
const busyCache = new Map<string, CachedBusy>();

export async function getBusySlots(
	userId: string,
	timeMin: Date,
	timeMax: Date
): Promise<BusySlot[]> {
	// Key on userId + hour so the window is stable within the same hour
	const cacheKey = `${userId}:${timeMin.toISOString().slice(0, 13)}`;
	const hit = busyCache.get(cacheKey);
	if (hit && hit.expiresAt > Date.now()) return hit.slots;

	const { calendar, calendarId } = await getCalendarClient(userId);

	const res = await calendar.freebusy.query({
		requestBody: {
			timeMin: timeMin.toISOString(),
			timeMax: timeMax.toISOString(),
			items: [{ id: calendarId }]
		}
	});

	const slots = (res.data.calendars?.[calendarId]?.busy ?? []) as BusySlot[];
	busyCache.set(cacheKey, { slots, expiresAt: Date.now() + 10 * 60 * 1000 });
	return slots;
}

export function invalidateBusySlotsCache(userId: string) {
	for (const key of busyCache.keys()) {
		if (key.startsWith(`${userId}:`)) busyCache.delete(key);
	}
}

export async function createCalendarEvent(
	userId: string,
	event: {
		summary: string;
		description?: string;
		startTime: Date;
		endTime: Date;
		attendeeEmail: string;
		// 'phone' skips Google Meet creation; the client number is injected later (see reveal cron)
		locationType?: 'meet' | 'phone';
		location?: string;
	}
): Promise<{ eventId: string; meetLink: string | null }> {
	const { calendar, calendarId } = await getCalendarClient(userId);
	const isPhone = event.locationType === 'phone';

	const res = await calendar.events.insert({
		calendarId,
		conferenceDataVersion: isPhone ? 0 : 1,
		requestBody: {
			summary: event.summary,
			description: event.description,
			location: event.location,
			start: { dateTime: event.startTime.toISOString() },
			end: { dateTime: event.endTime.toISOString() },
			attendees: [{ email: event.attendeeEmail }],
			...(isPhone ? {} : { conferenceData: { createRequest: { requestId: crypto.randomUUID() } } })
		}
	});

	if (!res.data.id) throw new Error('Failed to create Google Calendar event');

	const meetLink = isPhone
		? null
		: (res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
			null);

	return { eventId: res.data.id, meetLink };
}

export async function deleteCalendarEvent(userId: string, googleEventId: string): Promise<void> {
	const { calendar, calendarId } = await getCalendarClient(userId);
	await calendar.events.delete({ calendarId, eventId: googleEventId });
}

export async function updateCalendarEvent(
	userId: string,
	googleEventId: string,
	patch: { startTime?: Date; endTime?: Date; location?: string }
): Promise<void> {
	const { calendar, calendarId } = await getCalendarClient(userId);

	await calendar.events.patch({
		calendarId,
		eventId: googleEventId,
		requestBody: {
			...(patch.startTime ? { start: { dateTime: patch.startTime.toISOString() } } : {}),
			...(patch.endTime ? { end: { dateTime: patch.endTime.toISOString() } } : {}),
			...(patch.location !== undefined ? { location: patch.location } : {})
		}
	});
}
