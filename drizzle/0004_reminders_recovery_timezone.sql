ALTER TABLE "bookings" ADD COLUMN "second_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "briefs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "briefs" ADD COLUMN "recovery_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "prospect_tracking" ADD COLUMN "followup_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "timezone" text DEFAULT 'Europe/Paris' NOT NULL;--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;