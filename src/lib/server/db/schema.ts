import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
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

// Re-exported from $lib/form-fields so Drizzle's $type<> can reference them without $lib alias
export type FormFieldOption = { value: string; label: string };
export type FormFieldType = 'text' | 'textarea' | 'radio' | 'select';
export type FormField = {
	key: string;
	label: string;
	type: FormFieldType;
	options?: FormFieldOption[];
	required?: boolean;
	enabled: boolean;
	placeholder?: string;
};

// One row per user — replaces the global app_settings singleton
export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	username: text('username').notNull().unique(), // public URL slug: /[username]/[eventSlug]
	notificationEmail: text('notification_email'),
	bufferMinutes: integer('buffer_minutes').notNull().default(15),
	// IANA timezone used to interpret availability hours when computing public slots
	timezone: text('timezone').notNull().default('Europe/Paris'),
	portfolioLinks: jsonb('portfolio_links').$type<PortfolioLink[]>(),
	preferredLocale: text('preferred_locale').notNull().default('fr'),
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
		locationType: text('location_type').notNull().default('meet'), // meet | phone
		color: text('color').default('#6366f1'),
		sortOrder: integer('sort_order').default(0),
		formFields: jsonb('form_fields').$type<FormField[] | null>(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		unique().on(t.userId, t.slug),
		index('event_types_userId_isActive_idx').on(t.userId, t.isActive)
	]
);

export const availability = pgTable(
	'availability',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		dayOfWeek: integer('day_of_week').notNull(), // 0=sun … 6=sat
		startTime: text('start_time').notNull(), // "09:00"
		endTime: text('end_time').notNull(), // "18:00"
		isActive: boolean('is_active').default(true).notNull()
	},
	(t) => [index('availability_userId_idx').on(t.userId)]
);

export const bookings = pgTable(
	'bookings',
	{
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
		clientPhone: text('client_phone'), // collected when the event type is a phone call
		startTime: timestamp('start_time').notNull(),
		endTime: timestamp('end_time').notNull(),
		status: text('status').default('confirmed').notNull(), // confirmed | cancelled | rescheduled | completed
		source: text('source'), // malt | linkedin | portfolio | direct
		googleEventId: text('google_event_id'),
		meetLink: text('meet_link'),
		rescheduleToken: text('reschedule_token').unique(),
		locale: text('locale').notNull().default('fr'),
		reminderSentAt: timestamp('reminder_sent_at'),
		// Second reminder, sent ~1h before the meeting (distinct from the 24h reminderSentAt)
		secondReminderSentAt: timestamp('second_reminder_sent_at'),
		// Set once the client's phone number has been revealed to the freelance (~30 min before a phone call)
		phoneRevealedAt: timestamp('phone_revealed_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		// user-scoped queries (getUpcomingBookings, getAllBookings, getAvailableSlots)
		index('bookings_userId_status_startTime_idx').on(t.userId, t.status, t.startTime),
		// cron: sendReminders and markCompleted filter by status + time without a userId
		index('bookings_status_startTime_idx').on(t.status, t.startTime),
		index('bookings_status_endTime_idx').on(t.status, t.endTime)
	]
);

// Created as soon as the client starts filling the form — bookingId is null until they confirm a slot
export const briefs = pgTable(
	'briefs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		bookingId: uuid('booking_id').references(() => bookings.id),
		// The freelance the brief targets — lets the recovery cron route abandoned briefs
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		clientEmail: text('client_email').notNull(),
		companyName: text('company_name'),
		projectDescription: text('project_description'),
		stack: text('stack'),
		missionType: text('mission_type'), // courte | longue | conseil
		budget: text('budget'),
		urgency: text('urgency'), // normal | urgent
		customFields: jsonb('custom_fields').$type<Record<string, string> | null>(),
		companySiren: text('company_siren'),
		isAbandoned: boolean('is_abandoned').default(false).notNull(),
		// Set once the "you left a booking unfinished" recovery email has been sent to the client
		recoverySentAt: timestamp('recovery_sent_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		index('briefs_bookingId_idx').on(t.bookingId),
		// checkAbandoned: WHERE bookingId IS NULL AND isAbandoned = false AND createdAt < cutoff
		index('briefs_isAbandoned_createdAt_idx').on(t.isAbandoned, t.createdAt)
	]
);

export const prospectInsights = pgTable(
	'prospect_insights',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		bookingId: uuid('booking_id')
			.references(() => bookings.id)
			.notNull(),
		company: text('company'),
		companyDomain: text('company_domain'),
		companySiren: text('company_siren'),
		companySector: text('company_sector'),
		companySize: text('company_size'),
		companyDescription: text('company_description'),
		prospectRole: text('prospect_role'),
		aiBrief: text('ai_brief'),
		aiAngles: jsonb('ai_angles'), // string[]
		aiOpeningQuestion: text('ai_opening_question'),
		compatibilityScore: integer('compatibility_score'), // 0-100
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('prospect_insights_bookingId_idx').on(t.bookingId)]
);

export const prospectTracking = pgTable('prospect_tracking', {
	id: uuid('id').defaultRandom().primaryKey(),
	bookingId: uuid('booking_id')
		.references(() => bookings.id)
		.notNull()
		.unique(),
	outcome: text('outcome'), // signed | declined | followup | ghost | pending
	notes: text('notes'),
	followupDate: timestamp('followup_date'),
	// Set once the freelance has been emailed that this follow-up is due
	followupNotifiedAt: timestamp('followup_notified_at'),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const waitlist = pgTable(
	'waitlist',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventTypeId: uuid('event_type_id').references(() => eventTypes.id),
		email: text('email').notNull(),
		name: text('name'),
		notifiedAt: timestamp('notified_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('waitlist_eventTypeId_idx').on(t.eventTypeId)]
);

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
