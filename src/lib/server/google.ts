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

async function getCalendarClient(userId: string) {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
	}

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

	const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
	auth.setCredentials({ refresh_token: row.googleRefreshToken });

	return {
		calendar: google.calendar({ version: 'v3', auth }),
		calendarId: row.googleCalendarId
	};
}

export interface BusySlot {
	start: string;
	end: string;
}

export async function getBusySlots(
	userId: string,
	timeMin: Date,
	timeMax: Date
): Promise<BusySlot[]> {
	const { calendar, calendarId } = await getCalendarClient(userId);

	const res = await calendar.freebusy.query({
		requestBody: {
			timeMin: timeMin.toISOString(),
			timeMax: timeMax.toISOString(),
			items: [{ id: calendarId }]
		}
	});

	return (res.data.calendars?.[calendarId]?.busy ?? []) as BusySlot[];
}

export async function createCalendarEvent(
	userId: string,
	event: {
		summary: string;
		description?: string;
		startTime: Date;
		endTime: Date;
		attendeeEmail: string;
	}
): Promise<{ eventId: string; meetLink: string | null }> {
	const { calendar, calendarId } = await getCalendarClient(userId);

	const res = await calendar.events.insert({
		calendarId,
		conferenceDataVersion: 1,
		requestBody: {
			summary: event.summary,
			description: event.description,
			start: { dateTime: event.startTime.toISOString() },
			end: { dateTime: event.endTime.toISOString() },
			attendees: [{ email: event.attendeeEmail }],
			conferenceData: { createRequest: { requestId: crypto.randomUUID() } }
		}
	});

	if (!res.data.id) throw new Error('Failed to create Google Calendar event');

	const meetLink =
		res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ?? null;

	return { eventId: res.data.id, meetLink };
}

export async function deleteCalendarEvent(userId: string, googleEventId: string): Promise<void> {
	const { calendar, calendarId } = await getCalendarClient(userId);
	await calendar.events.delete({ calendarId, eventId: googleEventId });
}

export async function updateCalendarEvent(
	userId: string,
	googleEventId: string,
	patch: { startTime: Date; endTime: Date }
): Promise<void> {
	const { calendar, calendarId } = await getCalendarClient(userId);

	await calendar.events.patch({
		calendarId,
		eventId: googleEventId,
		requestBody: {
			start: { dateTime: patch.startTime.toISOString() },
			end: { dateTime: patch.endTime.toISOString() }
		}
	});
}
