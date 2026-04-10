import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';

import { user } from './auth.schema';
export * from './auth.schema';

export type PortfolioLink = { missionType: string; title: string; url: string };

// One row per user — replaces the global app_settings singleton
export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	username: text('username').notNull().unique(), // public URL slug: /[username]/[eventSlug]
	notificationEmail: text('notification_email'),
	bufferMinutes: integer('buffer_minutes').notNull().default(15),
	portfolioLinks: jsonb('portfolio_links').$type<PortfolioLink[]>(),
	googleRefreshToken: text('google_refresh_token'),
	googleCalendarId: text('google_calendar_id').notNull().default('primary')
});

export const eventTypes = pgTable(
	'event_types',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		slug: text('slug').notNull(), // unique per user, see constraint below
		name: text('name').notNull(),
		description: text('description'),
		duration: integer('duration').notNull(), // minutes
		isActive: boolean('is_active').default(true).notNull(),
		isBusyMode: boolean('is_busy_mode').default(false).notNull(),
		color: text('color').default('#6366f1'),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [unique().on(t.userId, t.slug)]
);

export const availability = pgTable('availability', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	dayOfWeek: integer('day_of_week').notNull(), // 0=sun … 6=sat
	startTime: text('start_time').notNull(), // "09:00"
	endTime: text('end_time').notNull(), // "18:00"
	isActive: boolean('is_active').default(true).notNull()
});

export const bookings = pgTable('bookings', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	eventTypeId: uuid('event_type_id')
		.references(() => eventTypes.id)
		.notNull(),
	clientName: text('client_name').notNull(),
	clientEmail: text('client_email').notNull(),
	clientLinkedin: text('client_linkedin'),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	status: text('status').default('confirmed').notNull(), // confirmed | cancelled | rescheduled | completed
	source: text('source'), // malt | linkedin | portfolio | direct
	googleEventId: text('google_event_id'),
	meetLink: text('meet_link'),
	rescheduleToken: text('reschedule_token').unique(),
	locale: text('locale').notNull().default('fr'),
	reminderSentAt: timestamp('reminder_sent_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Created as soon as the client starts filling the form — bookingId is null until they confirm a slot
export const briefs = pgTable('briefs', {
	id: uuid('id').defaultRandom().primaryKey(),
	bookingId: uuid('booking_id').references(() => bookings.id),
	clientEmail: text('client_email').notNull(),
	companyName: text('company_name'),
	projectDescription: text('project_description'),
	stack: text('stack'),
	missionType: text('mission_type'), // courte | longue | conseil
	budget: text('budget'),
	urgency: text('urgency'), // normal | urgent
	isAbandoned: boolean('is_abandoned').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const prospectInsights = pgTable('prospect_insights', {
	id: uuid('id').defaultRandom().primaryKey(),
	bookingId: uuid('booking_id')
		.references(() => bookings.id)
		.notNull(),
	company: text('company'),
	companyDomain: text('company_domain'),
	companySector: text('company_sector'),
	companySize: text('company_size'),
	companyDescription: text('company_description'),
	prospectRole: text('prospect_role'),
	aiBrief: text('ai_brief'),
	aiAngles: jsonb('ai_angles'), // string[]
	aiOpeningQuestion: text('ai_opening_question'),
	compatibilityScore: integer('compatibility_score'), // 0-100
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const prospectTracking = pgTable('prospect_tracking', {
	id: uuid('id').defaultRandom().primaryKey(),
	bookingId: uuid('booking_id')
		.references(() => bookings.id)
		.notNull()
		.unique(),
	outcome: text('outcome'), // signed | declined | followup | ghost | pending
	notes: text('notes'),
	followupDate: timestamp('followup_date'),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const waitlist = pgTable('waitlist', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventTypeId: uuid('event_type_id').references(() => eventTypes.id),
	email: text('email').notNull(),
	name: text('name'),
	notifiedAt: timestamp('notified_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, { fields: [userSettings.userId], references: [user.id] })
}));

export const eventTypesRelations = relations(eventTypes, ({ one, many }) => ({
	user: one(user, { fields: [eventTypes.userId], references: [user.id] }),
	bookings: many(bookings),
	waitlist: many(waitlist)
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
	user: one(user, { fields: [availability.userId], references: [user.id] })
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	user: one(user, { fields: [bookings.userId], references: [user.id] }),
	eventType: one(eventTypes, { fields: [bookings.eventTypeId], references: [eventTypes.id] }),
	brief: one(briefs, { fields: [bookings.id], references: [briefs.bookingId] }),
	insights: one(prospectInsights, {
		fields: [bookings.id],
		references: [prospectInsights.bookingId]
	}),
	tracking: one(prospectTracking, {
		fields: [bookings.id],
		references: [prospectTracking.bookingId]
	})
}));

export const briefsRelations = relations(briefs, ({ one }) => ({
	booking: one(bookings, { fields: [briefs.bookingId], references: [bookings.id] })
}));

export const prospectInsightsRelations = relations(prospectInsights, ({ one }) => ({
	booking: one(bookings, { fields: [prospectInsights.bookingId], references: [bookings.id] })
}));

export const prospectTrackingRelations = relations(prospectTracking, ({ one }) => ({
	booking: one(bookings, { fields: [prospectTracking.bookingId], references: [bookings.id] })
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
	eventType: one(eventTypes, { fields: [waitlist.eventTypeId], references: [eventTypes.id] })
}));
