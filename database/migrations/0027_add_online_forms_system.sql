-- Migration: Add Online Forms System
-- This migration creates all tables and enums for the online forms system

-- Create email_validation_mode enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."email_validation_mode" AS ENUM('start', 'end');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create form_target_module enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."form_target_module" AS ENUM('registratura', 'general_register', 'events', 'partners');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create submission_flow enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."submission_flow" AS ENUM('direct', 'review');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create form_field_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."form_field_type" AS ENUM('text', 'email', 'textarea', 'select', 'date', 'number', 'file');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create form_submission_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."form_submission_status" AS ENUM('pending_validation', 'validated', 'processing', 'completed', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create online_forms table
CREATE TABLE IF NOT EXISTS "online_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_validation_mode" "email_validation_mode" DEFAULT 'end' NOT NULL,
	"submission_flow" "submission_flow" DEFAULT 'review' NOT NULL,
	"target_module" "form_target_module" NOT NULL,
	"widget_code" varchar(100) NOT NULL,
	"success_message" text,
	"error_message" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "online_forms_widget_code_unique" UNIQUE("widget_code")
);
--> statement-breakpoint

-- Create online_form_fields table
CREATE TABLE IF NOT EXISTS "online_form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"field_type" "form_field_type" NOT NULL,
	"label" varchar(255) NOT NULL,
	"placeholder" varchar(255),
	"help_text" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"validation_rules" jsonb,
	"options" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create online_form_field_mappings table
CREATE TABLE IF NOT EXISTS "online_form_field_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"target_table" varchar(100) NOT NULL,
	"target_column" varchar(100) NOT NULL,
	"transformation" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create online_form_submissions table
CREATE TABLE IF NOT EXISTS "online_form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"submission_token" varchar(100) NOT NULL,
	"status" "form_submission_status" DEFAULT 'pending_validation' NOT NULL,
	"email" varchar(255),
	"email_validated_at" timestamp with time zone,
	"form_data" jsonb NOT NULL,
	"target_record_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by" uuid,
	CONSTRAINT "online_form_submissions_submission_token_unique" UNIQUE("submission_token")
);
--> statement-breakpoint

-- Create online_form_email_validations table
CREATE TABLE IF NOT EXISTS "online_form_email_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"validation_code" varchar(10) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "online_forms" ADD CONSTRAINT "online_forms_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_forms" ADD CONSTRAINT "online_forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_forms" ADD CONSTRAINT "online_forms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_form_fields" ADD CONSTRAINT "online_form_fields_form_id_online_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."online_forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_form_field_mappings" ADD CONSTRAINT "online_form_field_mappings_form_id_online_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."online_forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_form_submissions" ADD CONSTRAINT "online_form_submissions_form_id_online_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."online_forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_form_submissions" ADD CONSTRAINT "online_form_submissions_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "online_form_email_validations" ADD CONSTRAINT "online_form_email_validations_submission_id_online_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."online_form_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

