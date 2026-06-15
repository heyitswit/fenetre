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

const tpl = {
	confirmation: Handlebars.compile(confirmationSrc),
	reminder: Handlebars.compile(reminderSrc),
	notification: Handlebars.compile(notificationSrc),
	resetPassword: Handlebars.compile(resetPasswordSrc)
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
}

export function reminderEmail(data: ReminderEmailData): { subject: string; html: string } {
	const firstName = data.clientName.split(' ')[0];
	const l = { locale: data.locale } as const;

	return {
		subject: m['email.reminder.subject']({ eventTypeName: data.eventTypeName }, l),
		html: toHtml(tpl.reminder, {
			greeting: m['email.reminder.greeting']({ firstName }, l),
			body: m['email.reminder.body'](
				{
					time: formatTime(data.startTime, data.locale),
					eventTypeName: data.eventTypeName
				},
				l
			),
			context: m['email.reminder.context']({}, l),
			meetLink: data.meetLink,
			meetLabel: m['email.confirmation.meet']({}, l),
			seeYou: m['email.reminder.see_you']({}, l),
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
	const scoreBadge = score !== null
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
					scoreBadgeBg: score !== null && score >= 80 ? '#c8f5d8' : score !== null && score >= 50 ? '#fef3c7' : '#f3f4f6',
					scoreBadgeColor: score !== null && score >= 80 ? '#166534' : score !== null && score >= 50 ? '#92400e' : '#6b7280'
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
