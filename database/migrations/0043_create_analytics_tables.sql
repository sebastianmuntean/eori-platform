-- Migration: Create Analytics Tables
-- This migration creates tables for saved reports and analytics

-- Create chart_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."chart_type" AS ENUM('line', 'bar', 'pie', 'area', 'scatter');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create report_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."report_type" AS ENUM('user_activity', 'document_creation', 'event_statistics', 'financial_summary', 'parishioner_growth', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create saved_reports table
CREATE TABLE IF NOT EXISTS "saved_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"report_type" "report_type" NOT NULL,
	"chart_type" "chart_type" NOT NULL,
	"date_range" jsonb,
	"parish_id" uuid,
	"diocese_id" uuid,
	"config" jsonb NOT NULL,
	"is_public" boolean DEFAULT false,
	"shared_with" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_generated_at" timestamp with time zone
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_diocese_id_dioceses_id_fk" FOREIGN KEY ("diocese_id") REFERENCES "public"."dioceses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

