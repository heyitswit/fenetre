ALTER TABLE "bookings" ADD COLUMN "client_phone" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "phone_revealed_at" timestamp;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "location_type" text DEFAULT 'meet' NOT NULL;