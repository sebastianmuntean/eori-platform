-- Migration: Add pilgrimages module
-- This migration creates all tables and enums for the pilgrimages management module

-- Create pilgrimage_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."pilgrimage_status" AS ENUM('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create participant_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."participant_status" AS ENUM('registered', 'confirmed', 'paid', 'cancelled', 'waitlisted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create participant_payment_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."participant_payment_status" AS ENUM('pending', 'partial', 'paid', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create activity_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('liturgy', 'prayer', 'visit', 'meal', 'transport', 'accommodation', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create document_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('program', 'information', 'contract', 'insurance', 'visa_info', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payment_method enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payment_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create transport_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."transport_type" AS ENUM('bus', 'train', 'plane', 'car', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create accommodation_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."accommodation_type" AS ENUM('hotel', 'monastery', 'hostel', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create room_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."room_type" AS ENUM('single', 'double', 'triple', 'quad', 'dormitory');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create meal_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create workflow_action enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."workflow_action" AS ENUM('created', 'approved', 'rejected', 'published', 'closed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create pilgrimages table
CREATE TABLE IF NOT EXISTS "pilgrimages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"destination" varchar(255),
	"start_date" date,
	"end_date" date,
	"registration_deadline" date,
	"max_participants" integer,
	"min_participants" integer,
	"status" "pilgrimage_status" DEFAULT 'draft' NOT NULL,
	"price_per_person" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'RON',
	"organizer_name" varchar(255),
	"organizer_contact" varchar(255),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Create pilgrimage_participants table
CREATE TABLE IF NOT EXISTS "pilgrimage_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"parishioner_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"cnp" varchar(13),
	"birth_date" date,
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"postal_code" varchar(20),
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(50),
	"special_needs" text,
	"status" "participant_status" DEFAULT 'registered' NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_status" "participant_payment_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_schedule table
CREATE TABLE IF NOT EXISTS "pilgrimage_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"day_number" integer,
	"date" date,
	"time" time,
	"title" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(255),
	"activity_type" "activity_type" NOT NULL,
	"duration_minutes" integer,
	"is_optional" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_documents table
CREATE TABLE IF NOT EXISTS "pilgrimage_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"is_public" boolean DEFAULT false,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_payments table
CREATE TABLE IF NOT EXISTS "pilgrimage_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_reference" varchar(255),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_transport table
CREATE TABLE IF NOT EXISTS "pilgrimage_transport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"transport_type" "transport_type" NOT NULL,
	"departure_location" varchar(255),
	"departure_date" date,
	"departure_time" time,
	"arrival_location" varchar(255),
	"arrival_date" date,
	"arrival_time" time,
	"provider_name" varchar(255),
	"provider_contact" varchar(255),
	"vehicle_details" text,
	"capacity" integer,
	"price_per_person" numeric(10, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_accommodation table
CREATE TABLE IF NOT EXISTS "pilgrimage_accommodation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"accommodation_name" varchar(255),
	"accommodation_type" "accommodation_type",
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"country" varchar(100),
	"check_in_date" date,
	"check_out_date" date,
	"room_type" "room_type",
	"total_rooms" integer,
	"price_per_night" numeric(10, 2),
	"contact_name" varchar(255),
	"contact_phone" varchar(50),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_meals table
CREATE TABLE IF NOT EXISTS "pilgrimage_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"meal_date" date,
	"meal_type" "meal_type" NOT NULL,
	"meal_time" time,
	"location" varchar(255),
	"provider_name" varchar(255),
	"menu_description" text,
	"price_per_person" numeric(10, 2),
	"dietary_options" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create pilgrimage_workflow table
CREATE TABLE IF NOT EXISTS "pilgrimage_workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilgrimage_id" uuid NOT NULL,
	"action" "workflow_action" NOT NULL,
	"from_status" varchar(50),
	"to_status" varchar(50),
	"performed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for pilgrimages
DO $$ BEGIN
 ALTER TABLE "pilgrimages" ADD CONSTRAINT "pilgrimages_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimages" ADD CONSTRAINT "pilgrimages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimages" ADD CONSTRAINT "pilgrimages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_participants
DO $$ BEGIN
 ALTER TABLE "pilgrimage_participants" ADD CONSTRAINT "pilgrimage_participants_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimage_participants" ADD CONSTRAINT "pilgrimage_participants_parishioner_id_clients_id_fk" FOREIGN KEY ("parishioner_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_schedule
DO $$ BEGIN
 ALTER TABLE "pilgrimage_schedule" ADD CONSTRAINT "pilgrimage_schedule_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_documents
DO $$ BEGIN
 ALTER TABLE "pilgrimage_documents" ADD CONSTRAINT "pilgrimage_documents_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimage_documents" ADD CONSTRAINT "pilgrimage_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_payments
DO $$ BEGIN
 ALTER TABLE "pilgrimage_payments" ADD CONSTRAINT "pilgrimage_payments_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimage_payments" ADD CONSTRAINT "pilgrimage_payments_participant_id_pilgrimage_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "pilgrimage_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimage_payments" ADD CONSTRAINT "pilgrimage_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_transport
DO $$ BEGIN
 ALTER TABLE "pilgrimage_transport" ADD CONSTRAINT "pilgrimage_transport_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_accommodation
DO $$ BEGIN
 ALTER TABLE "pilgrimage_accommodation" ADD CONSTRAINT "pilgrimage_accommodation_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_meals
DO $$ BEGIN
 ALTER TABLE "pilgrimage_meals" ADD CONSTRAINT "pilgrimage_meals_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for pilgrimage_workflow
DO $$ BEGIN
 ALTER TABLE "pilgrimage_workflow" ADD CONSTRAINT "pilgrimage_workflow_pilgrimage_id_pilgrimages_id_fk" FOREIGN KEY ("pilgrimage_id") REFERENCES "pilgrimages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pilgrimage_workflow" ADD CONSTRAINT "pilgrimage_workflow_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimages
CREATE INDEX IF NOT EXISTS "pilgrimages_parish_id_idx" ON "pilgrimages" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimages_status_idx" ON "pilgrimages" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimages_start_date_idx" ON "pilgrimages" ("start_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimages_end_date_idx" ON "pilgrimages" ("end_date");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_participants
CREATE INDEX IF NOT EXISTS "pilgrimage_participants_pilgrimage_id_idx" ON "pilgrimage_participants" ("pilgrimage_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_participants_parishioner_id_idx" ON "pilgrimage_participants" ("parishioner_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_participants_status_idx" ON "pilgrimage_participants" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_participants_payment_status_idx" ON "pilgrimage_participants" ("payment_status");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_schedule
CREATE INDEX IF NOT EXISTS "pilgrimage_schedule_pilgrimage_id_idx" ON "pilgrimage_schedule" ("pilgrimage_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_schedule_date_idx" ON "pilgrimage_schedule" ("date");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_documents
CREATE INDEX IF NOT EXISTS "pilgrimage_documents_pilgrimage_id_idx" ON "pilgrimage_documents" ("pilgrimage_id");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_payments
CREATE INDEX IF NOT EXISTS "pilgrimage_payments_pilgrimage_id_idx" ON "pilgrimage_payments" ("pilgrimage_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_payments_participant_id_idx" ON "pilgrimage_payments" ("participant_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pilgrimage_payments_status_idx" ON "pilgrimage_payments" ("status");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_transport
CREATE INDEX IF NOT EXISTS "pilgrimage_transport_pilgrimage_id_idx" ON "pilgrimage_transport" ("pilgrimage_id");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_accommodation
CREATE INDEX IF NOT EXISTS "pilgrimage_accommodation_pilgrimage_id_idx" ON "pilgrimage_accommodation" ("pilgrimage_id");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_meals
CREATE INDEX IF NOT EXISTS "pilgrimage_meals_pilgrimage_id_idx" ON "pilgrimage_meals" ("pilgrimage_id");
--> statement-breakpoint

-- Create indexes for better query performance on pilgrimage_workflow
CREATE INDEX IF NOT EXISTS "pilgrimage_workflow_pilgrimage_id_idx" ON "pilgrimage_workflow" ("pilgrimage_id");
--> statement-breakpoint

