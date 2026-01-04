-- Migration: Add Document Management System (Registratură)
-- This migration creates all tables and enums for the document management system

-- Create document_priority enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."document_priority" AS ENUM('low', 'normal', 'high', 'urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create workflow_action enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."workflow_action" AS ENUM('sent', 'received', 'resolved', 'returned', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create connection_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."connection_type" AS ENUM('related', 'response', 'attachment', 'amendment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Note: document_status enum may already exist from migration 0010
-- We'll use the existing document_status enum if it exists, otherwise create document_registry_status
DO $$ BEGIN
 CREATE TYPE "public"."document_status" AS ENUM('draft', 'registered', 'in_work', 'resolved', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Note: document_type enum may already exist from migration 0010
-- We'll use the existing document_type enum if it exists, otherwise create document_registry_type
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('incoming', 'outgoing', 'internal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create document_registry table
CREATE TABLE IF NOT EXISTS "document_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"registration_number" integer,
	"registration_year" integer,
	"formatted_number" varchar(50),
	"document_type" "document_type" NOT NULL,
	"registration_date" date,
	"external_number" varchar(100),
	"external_date" date,
	"sender_partner_id" uuid,
	"sender_name" varchar(255),
	"sender_doc_number" varchar(100),
	"sender_doc_date" date,
	"recipient_partner_id" uuid,
	"recipient_name" varchar(255),
	"subject" varchar(500) NOT NULL,
	"content" text,
	"priority" "document_priority" DEFAULT 'normal' NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"department_id" uuid,
	"assigned_to" uuid,
	"due_date" date,
	"resolved_date" date,
	"file_index" varchar(50),
	"parent_document_id" uuid,
	"is_secret" boolean DEFAULT false NOT NULL,
	"secret_declassification_list" text[],
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

-- Create document_attachments table
CREATE TABLE IF NOT EXISTS "document_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" bigint NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_signed" boolean DEFAULT false NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp with time zone,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create document_workflow table
CREATE TABLE IF NOT EXISTS "document_workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"from_department_id" uuid,
	"to_department_id" uuid,
	"action" "workflow_action" NOT NULL,
	"resolution" text,
	"notes" text,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create document_number_counters table
CREATE TABLE IF NOT EXISTS "document_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"document_type" "document_type" NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_number_counters_parish_id_year_document_type_unique" UNIQUE("parish_id","year","document_type")
);
--> statement-breakpoint

-- Create document_connections table
CREATE TABLE IF NOT EXISTS "document_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"connected_document_id" uuid NOT NULL,
	"connection_type" "connection_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create document_archive table
CREATE TABLE IF NOT EXISTS "document_archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"archive_indicator" varchar(50),
	"archive_term" varchar(50),
	"archive_location" varchar(255),
	"archived_by" uuid NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for document_registry
DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_sender_partner_id_partners_id_fk" FOREIGN KEY ("sender_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_recipient_partner_id_partners_id_fk" FOREIGN KEY ("recipient_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_parent_document_id_document_registry_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."document_registry"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_registry" ADD CONSTRAINT "document_registry_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for document_attachments
DO $$ BEGIN
 ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_document_id_document_registry_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for document_workflow
DO $$ BEGIN
 ALTER TABLE "document_workflow" ADD CONSTRAINT "document_workflow_document_id_document_registry_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_workflow" ADD CONSTRAINT "document_workflow_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_workflow" ADD CONSTRAINT "document_workflow_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_workflow" ADD CONSTRAINT "document_workflow_from_department_id_departments_id_fk" FOREIGN KEY ("from_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_workflow" ADD CONSTRAINT "document_workflow_to_department_id_departments_id_fk" FOREIGN KEY ("to_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for document_number_counters
DO $$ BEGIN
 ALTER TABLE "document_number_counters" ADD CONSTRAINT "document_number_counters_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for document_connections
DO $$ BEGIN
 ALTER TABLE "document_connections" ADD CONSTRAINT "document_connections_document_id_document_registry_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_connections" ADD CONSTRAINT "document_connections_connected_document_id_document_registry_id_fk" FOREIGN KEY ("connected_document_id") REFERENCES "public"."document_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for document_archive
DO $$ BEGIN
 ALTER TABLE "document_archive" ADD CONSTRAINT "document_archive_document_id_document_registry_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_registry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "document_archive" ADD CONSTRAINT "document_archive_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

