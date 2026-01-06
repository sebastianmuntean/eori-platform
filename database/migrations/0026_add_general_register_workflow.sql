-- Migration: Add General Register Workflow System
-- This migration extends the general_register system with workflow tracking and tree structure

-- Alter document_status enum to add new values if they don't exist
-- Note: document_status enum already exists from migrations 0010 and 0025
-- We need to add: 'in_work', 'distributed', 'resolved', 'cancelled'
DO $$ 
BEGIN
    -- Add 'in_work' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'in_work' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_status')
    ) THEN
        ALTER TYPE "public"."document_status" ADD VALUE 'in_work';
    END IF;

    -- Add 'distributed' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'distributed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_status')
    ) THEN
        ALTER TYPE "public"."document_status" ADD VALUE 'distributed';
    END IF;

    -- Add 'resolved' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'resolved' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_status')
    ) THEN
        ALTER TYPE "public"."document_status" ADD VALUE 'resolved';
    END IF;

    -- Add 'cancelled' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_status')
    ) THEN
        ALTER TYPE "public"."document_status" ADD VALUE 'cancelled';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If enum doesn't exist at all, create it with all values
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
            CREATE TYPE "public"."document_status" AS ENUM('draft', 'registered', 'in_work', 'distributed', 'resolved', 'archived', 'cancelled');
        END IF;
END $$;
--> statement-breakpoint

-- Create general_register_workflow_action enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."general_register_workflow_action" AS ENUM('sent', 'forwarded', 'returned', 'approved', 'rejected', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create general_register_step_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."general_register_step_status" AS ENUM('pending', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create general_register_resolution_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."general_register_resolution_status" AS ENUM('approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create general_register_workflow table
CREATE TABLE IF NOT EXISTS "general_register_workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_step_id" uuid,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"action" "general_register_workflow_action" NOT NULL,
	"step_status" "general_register_step_status" DEFAULT 'pending' NOT NULL,
	"resolution_status" "general_register_resolution_status",
	"resolution" text,
	"notes" text,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_document_id_general_register_id_fk" FOREIGN KEY ("document_id") REFERENCES "general_register"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_parent_step_id_general_register_workflow_id_fk" FOREIGN KEY ("parent_step_id") REFERENCES "general_register_workflow"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "general_register_workflow_document_id_idx" ON "general_register_workflow" ("document_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_workflow_parent_step_id_idx" ON "general_register_workflow" ("parent_step_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_workflow_from_user_id_idx" ON "general_register_workflow" ("from_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_workflow_to_user_id_idx" ON "general_register_workflow" ("to_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_workflow_step_status_idx" ON "general_register_workflow" ("step_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_workflow_resolution_status_idx" ON "general_register_workflow" ("resolution_status");
--> statement-breakpoint

-- Create unique constraint to prevent duplicate pending steps for the same document, parent, and user
-- Note: PostgreSQL partial unique indexes allow NULL values, so we use a partial index for pending steps only
CREATE UNIQUE INDEX IF NOT EXISTS "general_register_workflow_document_parent_to_pending_unique" 
ON "general_register_workflow" ("document_id", "parent_step_id", "to_user_id", "step_status") 
WHERE "step_status" = 'pending' AND "to_user_id" IS NOT NULL;








