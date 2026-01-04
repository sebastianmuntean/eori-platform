-- Create event_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('wedding', 'baptism', 'funeral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create event_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."event_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create participant_role enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."participant_role" AS ENUM('bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create email_submission_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."email_submission_status" AS ENUM('pending', 'processed', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create church_events table
CREATE TABLE IF NOT EXISTS "church_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "event_type" NOT NULL,
	"status" "event_status" DEFAULT 'pending' NOT NULL,
	"event_date" date,
	"location" varchar(255),
	"priest_name" varchar(255),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Create church_event_participants table
CREATE TABLE IF NOT EXISTS "church_event_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"parishioner_id" uuid,
	"role" "participant_role" NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"birth_date" date,
	"cnp" varchar(13),
	"address" text,
	"city" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create church_event_documents table
CREATE TABLE IF NOT EXISTS "church_event_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50),
	"file_size" varchar(50),
	"description" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create church_event_email_submissions table
CREATE TABLE IF NOT EXISTS "church_event_email_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"from_email" varchar(255) NOT NULL,
	"subject" varchar(500),
	"content" text NOT NULL,
	"status" "email_submission_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for church_events
DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for church_event_participants
DO $$ BEGIN
 ALTER TABLE "church_event_participants" ADD CONSTRAINT "church_event_participants_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_event_participants" ADD CONSTRAINT "church_event_participants_parishioner_id_parishioners_id_fk" FOREIGN KEY ("parishioner_id") REFERENCES "parishioners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for church_event_documents
DO $$ BEGIN
 ALTER TABLE "church_event_documents" ADD CONSTRAINT "church_event_documents_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_event_documents" ADD CONSTRAINT "church_event_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for church_event_email_submissions
DO $$ BEGIN
 ALTER TABLE "church_event_email_submissions" ADD CONSTRAINT "church_event_email_submissions_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance on church_events
CREATE INDEX IF NOT EXISTS "church_events_parish_id_idx" ON "church_events" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_events_type_idx" ON "church_events" ("type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_events_status_idx" ON "church_events" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_events_event_date_idx" ON "church_events" ("event_date");
--> statement-breakpoint

-- Create indexes for better query performance on church_event_participants
CREATE INDEX IF NOT EXISTS "church_event_participants_event_id_idx" ON "church_event_participants" ("event_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_event_participants_parishioner_id_idx" ON "church_event_participants" ("parishioner_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_event_participants_role_idx" ON "church_event_participants" ("role");
--> statement-breakpoint

-- Create indexes for better query performance on church_event_documents
CREATE INDEX IF NOT EXISTS "church_event_documents_event_id_idx" ON "church_event_documents" ("event_id");
--> statement-breakpoint

-- Create indexes for better query performance on church_event_email_submissions
CREATE INDEX IF NOT EXISTS "church_event_email_submissions_event_id_idx" ON "church_event_email_submissions" ("event_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_event_email_submissions_status_idx" ON "church_event_email_submissions" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "church_event_email_submissions_from_email_idx" ON "church_event_email_submissions" ("from_email");



