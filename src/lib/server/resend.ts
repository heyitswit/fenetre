import { Resend } from 'resend';
import ical from 'ical-generator';
import { env } from '$lib/server/env';
import {
	confirmationEmail,
	reminderEmail,
	notificationEmail,
	passwordResetEmail,
	phoneRevealEmail
} from '$lib/server/emails';
import type { Locale } from '$lib/paraglide/runtime';
import type { InferSelectModel } from 'drizzle-orm';
import type { bookings, eventTypes, briefs } from '$lib/server/db/schema';
import type { PappersData } from '$lib/server/pappers';
import type { AiBriefResult } from '$lib/server/ai-brief';

type Booking = InferSelectModel<typeof bookings>;
type EventType = InferSelectModel<typeof eventTypes>;
type Brief = InferSelectModel<typeof briefs>;

export interface BookingWithRelations extends Booking {
	eventType: EventType;
	brief: Brief | null;
}

const resend = new Resend(env.RESEND_API_KEY);
const FROM = env.RESEND_FROM_EMAIL;

function generateIcs(booking: BookingWithRelations): string {
	const cal = ical({ name: 'fenetre' });
	const event = cal.createEvent({
		id: `${booking.id}@fenetre`,
		start: booking.startTime,
		end: booking.endTime,
		summary: booking.eventType.name
	});
	if (booking.meetLink) {
		event.url(booking.meetLink);
		event.location(booking.meetLink);
	}
	return cal.toString();
}

export async function sendConfirmationToClient(booking: BookingWithRelations): Promise<void> {
	const { subject, html } = confirmationEmail({
		clientName: booking.clientName,
		eventTypeName: booking.eventType.name,
		durationMin: booking.eventType.duration,
		startTime: booking.startTime,
		meetLink: booking.meetLink ?? null,
		isPhoneCall: booking.eventType.locationType === 'phone',
		rescheduleUrl: `${env.ORIGIN}/reschedule/${booking.rescheduleToken}`,
		locale: booking.locale as Locale
	});

	await resend.emails.send({
		from: FROM,
		to: booking.clientEmail,
		subject,
		html,
		attachments: [{ filename: 'rendez-vous.ics', content: generateIcs(booking) }]
	});
}

export async function sendNotificationToFreelance(
	booking: BookingWithRelations,
	notificationEmailAddress?: string,
	freelanceLocale?: Locale,
	pappers?: PappersData,
	aiResult?: AiBriefResult
): Promise<void> {
	const { subject, html } = notificationEmail({
		clientName: booking.clientName,
		clientEmail: booking.clientEmail,
		clientLinkedin: booking.clientLinkedin ?? null,
		source: booking.source ?? null,
		eventTypeName: booking.eventType.name,
		startTime: booking.startTime,
		meetLink: booking.meetLink ?? null,
		isPhoneCall: booking.eventType.locationType === 'phone',
		locale: freelanceLocale ?? (booking.locale as Locale),
		brief: booking.brief ?? null,
		pappers,
		aiResult
	});

	await resend.emails.send({
		from: FROM,
		to: notificationEmailAddress ?? FROM,
		subject,
		html
	});
}

export async function sendPhoneRevealToFreelance(
	booking: BookingWithRelations,
	notificationEmailAddress?: string,
	freelanceLocale?: Locale
): Promise<void> {
	if (!booking.clientPhone) return;

	const { subject, html } = phoneRevealEmail({
		clientName: booking.clientName,
		clientPhone: booking.clientPhone,
		startTime: booking.startTime,
		rescheduleUrl: `${env.ORIGIN}/reschedule/${booking.rescheduleToken}`,
		locale: freelanceLocale ?? (booking.locale as Locale)
	});

	await resend.emails.send({
		from: FROM,
		to: notificationEmailAddress ?? FROM,
		subject,
		html
	});
}

export async function sendPasswordReset(email: string, resetUrl: string): Promise<void> {
	const { subject, html } = passwordResetEmail(resetUrl);
	await resend.emails.send({ from: FROM, to: email, subject, html });
}

export async function sendReminderToClient(booking: BookingWithRelations): Promise<void> {
	const { subject, html } = reminderEmail({
		clientName: booking.clientName,
		eventTypeName: booking.eventType.name,
		startTime: booking.startTime,
		meetLink: booking.meetLink ?? null,
		rescheduleUrl: `${env.ORIGIN}/reschedule/${booking.rescheduleToken}`,
		locale: booking.locale as Locale
	});

	await resend.emails.send({
		from: FROM,
		to: booking.clientEmail,
		subject,
		html
	});
}
