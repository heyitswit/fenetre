import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import * as m from '$lib/paraglide/messages';
import type { Locale } from '$lib/paraglide/runtime';
import { formatDayLabel, formatTime } from '$lib/utils';
import type { PappersData } from '$lib/server/pappers';
import type { AiBriefResult } from '$lib/server/ai-brief';
import confirmationSrc from './templates/confirmation.mjml?raw';
import reminderSrc from './templates/reminder.mjml?raw';
import notificationSrc from './templates/notification.mjml?raw';
import resetPasswordSrc from './templates/reset-password.mjml?raw';
import phoneRevealSrc from './templates/phone-reveal.mjml?raw';
import followupSrc from './templates/followup.mjml?raw';
import recoverySrc from './templates/recovery.mjml?raw';

const tpl = {
	confirmation: Handlebars.compile(confirmationSrc),
	reminder: Handlebars.compile(reminderSrc),
	notification: Handlebars.compile(notificationSrc),
	resetPassword: Handlebars.compile(resetPasswordSrc),
	phoneReveal: Handlebars.compile(phoneRevealSrc),
	followup: Handlebars.compile(followupSrc),
	recovery: Handlebars.compile(recoverySrc)
};

function toHtml(compiled: HandlebarsTemplateDelegate, data: object): string {
	const { html, errors } = mjml2html(compiled(data), { validationLevel: 'soft' });
	if (errors.length) console.warn('[mjml]', errors);
	return html;
}

export interface ConfirmationEmailData {
	clientName: string;
	eventTypeName: string;
	durationMin: number;
	startTime: Date;
	meetLink: string | null;
	isPhoneCall?: boolean;
	rescheduleUrl: string;
	locale: Locale;
}

export function confirmationEmail(data: ConfirmationEmailData): { subject: string; html: string } {
	const firstName = data.clientName.split(' ')[0];
	const l = { locale: data.locale } as const;

	return {
		subject: m['email.confirmation.subject']({ firstName }, l),
		html: toHtml(tpl.confirmation, {
			title: m['email.confirmation.title']({ firstName }, l),
			eventTypeName: data.eventTypeName,
			details: `${data.durationMin} min`,
			date: formatDayLabel(data.startTime, data.locale),
			time: formatTime(data.startTime, data.locale),
			meetLink: data.meetLink,
			meetLabel: m['email.confirmation.meet']({}, l),
			phoneNote: data.isPhoneCall ? m['email.confirmation.phone_note']({}, l) : null,
			invitePending: m['email.confirmation.invite_pending']({}, l),
			rescheduleUrl: data.rescheduleUrl,
			rescheduleLabel: m['email.confirmation.reschedule']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}

export interface ReminderEmailData {
	clientName: string;
	eventTypeName: string;
	startTime: Date;
	meetLink: string | null;
	rescheduleUrl: string;
	locale: Locale;
	// When true, copy reads "in 1h" instead of "tomorrow" (same template)
	imminent?: boolean;
}

export function reminderEmail(data: ReminderEmailData): { subject: string; html: string } {
	const firstName = data.clientName.split(' ')[0];
	const l = { locale: data.locale } as const;
	const time = formatTime(data.startTime, data.locale);

	const copy = data.imminent
		? {
				subject: m['email.reminder_soon.subject']({ eventTypeName: data.eventTypeName }, l),
				body: m['email.reminder_soon.body']({ time, eventTypeName: data.eventTypeName }, l),
				seeYou: m['email.reminder_soon.see_you']({}, l)
			}
		: {
				subject: m['email.reminder.subject']({ eventTypeName: data.eventTypeName }, l),
				body: m['email.reminder.body']({ time, eventTypeName: data.eventTypeName }, l),
				seeYou: m['email.reminder.see_you']({}, l)
			};

	return {
		subject: copy.subject,
		html: toHtml(tpl.reminder, {
			greeting: m['email.reminder.greeting']({ firstName }, l),
			body: copy.body,
			context: m['email.reminder.context']({}, l),
			meetLink: data.meetLink,
			meetLabel: m['email.confirmation.meet']({}, l),
			seeYou: copy.seeYou,
			rescheduleUrl: data.rescheduleUrl,
			rescheduleLabel: m['email.reminder.reschedule']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}

export interface NotificationEmailData {
	clientName: string;
	clientEmail: string;
	clientLinkedin: string | null;
	source: string | null;
	eventTypeName: string;
	startTime: Date;
	meetLink: string | null;
	isPhoneCall?: boolean;
	locale: Locale;
	brief: {
		projectDescription: string | null;
		stack: string | null;
		missionType: string | null;
		budget: string | null;
		urgency: string | null;
	} | null;
	pappers?: PappersData | null;
	aiResult?: AiBriefResult | null;
}

export function passwordResetEmail(
	resetUrl: string,
	locale: Locale = 'fr'
): { subject: string; html: string } {
	const l = { locale } as const;
	return {
		subject: m['email.reset_password.subject']({}, l),
		html: toHtml(tpl.resetPassword, {
			title: m['email.reset_password.title']({}, l),
			body: m['email.reset_password.body']({}, l),
			buttonLabel: m['email.reset_password.button']({}, l),
			resetUrl,
			expiry: m['email.reset_password.expiry']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}

export interface FollowupEmailData {
	clientName: string;
	clientEmail: string;
	company: string | null;
	eventTypeName: string;
	originalDate: Date;
	notes: string | null;
	bookingUrl: string;
	locale: Locale;
}

export function followupEmail(data: FollowupEmailData): { subject: string; html: string } {
	const l = { locale: data.locale } as const;

	return {
		subject: m['email.followup.subject']({ clientName: data.clientName }, l),
		html: toHtml(tpl.followup, {
			title: m['email.followup.title']({}, l),
			intro: m['email.followup.intro'](
				{ clientName: data.clientName, company: data.company ?? data.clientEmail },
				l
			),
			originalLabel: m['email.followup.original_label']({}, l),
			originalValue: m['email.followup.original_value'](
				{ eventTypeName: data.eventTypeName, date: formatDayLabel(data.originalDate, data.locale) },
				l
			),
			notesLabel: data.notes ? m['email.followup.notes_label']({}, l) : null,
			notes: data.notes,
			bookingUrl: data.bookingUrl,
			cta: m['email.followup.cta']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}

export interface RecoveryEmailData {
	resumeUrl: string;
	locale: Locale;
}

export function recoveryEmail(data: RecoveryEmailData): { subject: string; html: string } {
	const l = { locale: data.locale } as const;

	return {
		subject: m['email.recovery.subject']({}, l),
		html: toHtml(tpl.recovery, {
			title: m['email.recovery.title']({}, l),
			body: m['email.recovery.body']({}, l),
			cta: m['email.recovery.cta']({}, l),
			resumeUrl: data.resumeUrl,
			footer: m['email.footer']({}, l)
		})
	};
}

export interface PhoneRevealEmailData {
	clientName: string;
	clientPhone: string;
	startTime: Date;
	rescheduleUrl: string;
	locale: Locale;
}

export function phoneRevealEmail(data: PhoneRevealEmailData): { subject: string; html: string } {
	const l = { locale: data.locale } as const;
	const telHref = `tel:${data.clientPhone.replace(/[^\d+]/g, '')}`;

	return {
		subject: m['email.phone_reveal.subject']({ clientName: data.clientName }, l),
		html: toHtml(tpl.phoneReveal, {
			title: m['email.phone_reveal.title']({}, l),
			intro: m['email.phone_reveal.intro'](
				{ clientName: data.clientName, time: formatTime(data.startTime, data.locale) },
				l
			),
			phone: data.clientPhone,
			telHref,
			callLabel: m['email.phone_reveal.call']({ clientName: data.clientName }, l),
			rescheduleUrl: data.rescheduleUrl,
			rescheduleLabel: m['email.phone_reveal.reschedule']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}

const MISSION_KEYS = {
	courte: 'brief.mission.courte',
	longue: 'brief.mission.longue',
	conseil: 'brief.mission.conseil'
} as const satisfies Record<string, keyof typeof m>;

const URGENCY_KEYS = {
	normal: 'brief.urgency.normal',
	urgent: 'brief.urgency.urgent'
} as const satisfies Record<string, keyof typeof m>;

function translateMissionType(type: string | null, l: { locale: Locale }): string | null {
	if (!type) return null;
	const key = MISSION_KEYS[type as keyof typeof MISSION_KEYS];
	return key ? m[key]({}, l) : type;
}

function translateUrgency(type: string | null, l: { locale: Locale }): string | null {
	if (!type) return null;
	const key = URGENCY_KEYS[type as keyof typeof URGENCY_KEYS];
	return key ? m[key]({}, l) : type;
}

export function notificationEmail(data: NotificationEmailData): { subject: string; html: string } {
	const l = { locale: data.locale } as const;

	const score = data.aiResult?.compatibilityScore ?? null;
	const scoreBadge =
		score !== null
			? score >= 80
				? `✓ Bonne compatibilité — ${score}/100`
				: score >= 50
					? `~ À évaluer — ${score}/100`
					: `↓ Faible compatibilité — ${score}/100`
			: null;

	const aiInsights =
		data.aiResult || data.pappers
			? {
					company: data.pappers?.company ?? null,
					companySector: data.pappers?.companySector ?? null,
					companySize: data.pappers?.companySize ?? null,
					aiBrief: data.aiResult?.aiBrief ?? null,
					aiAngles: data.aiResult?.aiAngles?.length ? data.aiResult.aiAngles : null,
					aiOpeningQuestion: data.aiResult?.aiOpeningQuestion ?? null,
					scoreBadge,
					scoreBadgeBg:
						score !== null && score >= 80
							? '#c8f5d8'
							: score !== null && score >= 50
								? '#fef3c7'
								: '#f3f4f6',
					scoreBadgeColor:
						score !== null && score >= 80
							? '#166534'
							: score !== null && score >= 50
								? '#92400e'
								: '#6b7280'
				}
			: null;

	return {
		subject: m['email.notification.subject'](
			{
				clientName: data.clientName,
				eventTypeName: data.eventTypeName
			},
			l
		),
		html: toHtml(tpl.notification, {
			title: m['email.notification.title']({}, l),
			clientName: data.clientName,
			clientEmail: data.clientEmail,
			clientLinkedin: data.clientLinkedin,
			source: data.source ?? 'direct',
			eventTypeName: data.eventTypeName,
			date: formatDayLabel(data.startTime, data.locale),
			meetLink: data.meetLink,
			phonePending: data.isPhoneCall ? m['email.notification.phone_pending']({}, l) : null,
			brief: data.brief
				? {
						...data.brief,
						missionType: translateMissionType(data.brief.missionType, l),
						urgency: translateUrgency(data.brief.urgency, l)
					}
				: null,
			aiInsights,
			labelName: m['email.notification.label_name']({}, l),
			labelEmail: m['email.notification.label_email']({}, l),
			labelSource: m['email.notification.label_source']({}, l),
			labelType: m['email.notification.label_type']({}, l),
			labelDate: m['email.notification.label_date']({}, l),
			labelLinkedin: m['email.notification.label_linkedin']({}, l),
			labelMeet: 'Google Meet',
			briefLabel: m['email.notification.brief_section']({}, l),
			labelProject: m['email.notification.label_project']({}, l),
			labelStack: m['email.notification.label_stack']({}, l),
			labelMission: m['email.notification.label_mission']({}, l),
			labelBudget: m['email.notification.label_budget']({}, l),
			labelUrgency: m['email.notification.label_urgency']({}, l),
			footer: m['email.footer']({}, l)
		})
	};
}
