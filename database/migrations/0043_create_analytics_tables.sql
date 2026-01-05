-- Migration: Create Analytics Tables
-- This migration creates tables for saved reports and analytics
-- Generated as part of analytics feature implementation

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create chart_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "public"."chart_type" AS ENUM('line', 'bar', 'pie', 'area', 'scatter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create report_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "public"."report_type" AS ENUM(
    'user_activity',
    'document_creation',
    'event_statistics',
    'financial_summary',
    'parishioner_growth',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================================
-- TABLES
-- ============================================================================

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
  "is_public" boolean DEFAULT false NOT NULL,
  "shared_with" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_generated_at" timestamp with time zone
);
--> statement-breakpoint

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint: user_id -> users.id
DO $$ BEGIN
  ALTER TABLE "saved_reports"
    ADD CONSTRAINT "saved_reports_user_id_users_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."users"("id")
    ON DELETE cascade
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraint: parish_id -> parishes.id
DO $$ BEGIN
  ALTER TABLE "saved_reports"
    ADD CONSTRAINT "saved_reports_parish_id_parishes_id_fk"
    FOREIGN KEY ("parish_id")
    REFERENCES "public"."parishes"("id")
    ON DELETE set null
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraint: diocese_id -> dioceses.id
DO $$ BEGIN
  ALTER TABLE "saved_reports"
    ADD CONSTRAINT "saved_reports_diocese_id_dioceses_id_fk"
    FOREIGN KEY ("diocese_id")
    REFERENCES "public"."dioceses"("id")
    ON DELETE set null
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on user_id for filtering reports by user
CREATE INDEX IF NOT EXISTS "idx_saved_reports_user_id"
  ON "saved_reports" USING btree ("user_id");
--> statement-breakpoint

-- Index on parish_id for filtering reports by parish
CREATE INDEX IF NOT EXISTS "idx_saved_reports_parish_id"
  ON "saved_reports" USING btree ("parish_id");
--> statement-breakpoint

-- Index on diocese_id for filtering reports by diocese
CREATE INDEX IF NOT EXISTS "idx_saved_reports_diocese_id"
  ON "saved_reports" USING btree ("diocese_id");
--> statement-breakpoint

-- Index on report_type for filtering by report type
CREATE INDEX IF NOT EXISTS "idx_saved_reports_report_type"
  ON "saved_reports" USING btree ("report_type");
--> statement-breakpoint

-- Index on created_at for sorting by creation date (DESC for recent first)
CREATE INDEX IF NOT EXISTS "idx_saved_reports_created_at"
  ON "saved_reports" USING btree ("created_at" DESC);
--> statement-breakpoint

-- Composite index for common query pattern: user reports by type
CREATE INDEX IF NOT EXISTS "idx_saved_reports_user_report_type"
  ON "saved_reports" USING btree ("user_id", "report_type");
--> statement-breakpoint

-- Composite index for common query pattern: parish reports by type
CREATE INDEX IF NOT EXISTS "idx_saved_reports_parish_report_type"
  ON "saved_reports" USING btree ("parish_id", "report_type")
  WHERE "parish_id" IS NOT NULL;
--> statement-breakpoint

-- Index on is_public for filtering public reports
CREATE INDEX IF NOT EXISTS "idx_saved_reports_is_public"
  ON "saved_reports" USING btree ("is_public")
  WHERE "is_public" = true;
--> statement-breakpoint

-- Index on last_generated_at for finding stale reports
CREATE INDEX IF NOT EXISTS "idx_saved_reports_last_generated_at"
  ON "saved_reports" USING btree ("last_generated_at")
  WHERE "last_generated_at" IS NOT NULL;
--> statement-breakpoint

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

-- Table comment
COMMENT ON TABLE "saved_reports" IS 'Stores saved analytics reports with their configuration and sharing settings';

-- Column comments
COMMENT ON COLUMN "saved_reports"."id" IS 'Primary key, UUID';
COMMENT ON COLUMN "saved_reports"."user_id" IS 'User who created the report (required)';
COMMENT ON COLUMN "saved_reports"."name" IS 'Report name/title';
COMMENT ON COLUMN "saved_reports"."description" IS 'Optional report description';
COMMENT ON COLUMN "saved_reports"."report_type" IS 'Type of analytics report (user_activity, document_creation, etc.)';
COMMENT ON COLUMN "saved_reports"."chart_type" IS 'Visualization type (line, bar, pie, area, scatter)';
COMMENT ON COLUMN "saved_reports"."date_range" IS 'JSONB object with start and end dates for the report';
COMMENT ON COLUMN "saved_reports"."parish_id" IS 'Optional parish filter for the report';
COMMENT ON COLUMN "saved_reports"."diocese_id" IS 'Optional diocese filter for the report';
COMMENT ON COLUMN "saved_reports"."config" IS 'JSONB object containing report configuration and chart settings';
COMMENT ON COLUMN "saved_reports"."is_public" IS 'Whether the report is publicly accessible';
COMMENT ON COLUMN "saved_reports"."shared_with" IS 'JSONB array of user IDs with whom the report is shared';
COMMENT ON COLUMN "saved_reports"."created_at" IS 'Timestamp when the report was created';
COMMENT ON COLUMN "saved_reports"."updated_at" IS 'Timestamp when the report was last updated';
COMMENT ON COLUMN "saved_reports"."last_generated_at" IS 'Timestamp when the report data was last generated/refreshed';
--> statement-breakpoint

