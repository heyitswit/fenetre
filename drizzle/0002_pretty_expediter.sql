ALTER TABLE "briefs" ADD COLUMN IF NOT EXISTS "company_name" text;--> statement-breakpoint
ALTER TABLE "briefs" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb;--> statement-breakpoint
ALTER TABLE "briefs" ADD COLUMN IF NOT EXISTS "company_siren" text;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN IF NOT EXISTS "form_fields" jsonb;--> statement-breakpoint
ALTER TABLE "prospect_insights" ADD COLUMN IF NOT EXISTS "company_siren" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "preferred_locale" text DEFAULT 'fr' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_userId_idx" ON "availability" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_userId_status_startTime_idx" ON "bookings" USING btree ("user_id","status","start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_status_startTime_idx" ON "bookings" USING btree ("status","start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_status_endTime_idx" ON "bookings" USING btree ("status","end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "briefs_bookingId_idx" ON "briefs" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "briefs_isAbandoned_createdAt_idx" ON "briefs" USING btree ("is_abandoned","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_types_userId_isActive_idx" ON "event_types" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospect_insights_bookingId_idx" ON "prospect_insights" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waitlist_eventTypeId_idx" ON "waitlist" USING btree ("event_type_id");
