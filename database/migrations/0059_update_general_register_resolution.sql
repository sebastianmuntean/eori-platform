-- Migration: Update general_register_step_status enum and add resolution fields to general_register
-- Run with: psql $DATABASE_URL -f database/migrations/0059_update_general_register_resolution.sql
-- Idempotent: safe to re-run if already applied.

-- Step 1: Create new enum type (ignore if already exists)
DO $$ BEGIN
  CREATE TYPE "public"."general_register_step_status_new" AS ENUM('in_work', 'redirected', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2a: Drop default and partial unique index that use the old enum (they cause "text = enum" during ALTER)
ALTER TABLE "general_register_workflow"
  ALTER COLUMN "step_status" DROP DEFAULT;

DROP INDEX IF EXISTS "general_register_workflow_document_parent_to_pending_unique";

-- Step 2b & 3: Change column to text then update values (only when still on old enum labels)
DO $$
BEGIN
  -- Only rewrite when column is not already the final enum (or is text mid-migration)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'general_register_workflow'
      AND column_name = 'step_status'
      AND (
        udt_name = 'general_register_step_status_new'
        OR data_type = 'text'
        OR udt_name = 'general_register_step_status'
      )
  ) THEN
    ALTER TABLE "general_register_workflow"
      ALTER COLUMN "step_status" TYPE text USING ("step_status"::text);

    UPDATE "general_register_workflow"
    SET "step_status" = 'in_work'
    WHERE "step_status" = 'pending';

    UPDATE "general_register_workflow"
    SET "step_status" = CASE
      WHEN "resolution_status" IS NOT NULL THEN 'resolved'
      ELSE 'in_work'
    END
    WHERE "step_status" = 'completed';
  END IF;
END $$;

-- Step 4: Drop old enum only if it still has old values (pending/completed); column is text so no dependency
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'general_register_step_status' AND e.enumlabel = 'pending'
  ) THEN
    DROP TYPE "public"."general_register_step_status";
  END IF;
END $$;

-- Step 5: Rename new enum to original name (skip if already renamed / final type exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'general_register_step_status_new'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'general_register_step_status'
  ) THEN
    ALTER TYPE "public"."general_register_step_status_new" RENAME TO "general_register_step_status";
  ELSIF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'general_register_step_status_new'
  ) AND EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'general_register_step_status'
  ) THEN
    -- Final type already present; drop leftover _new type if unused
    DROP TYPE "public"."general_register_step_status_new";
  END IF;
END $$;

-- Step 6: Change column from text to final enum (no-op if already correct)
DO $$ BEGIN
  ALTER TABLE "general_register_workflow"
    ALTER COLUMN "step_status" TYPE "general_register_step_status"
    USING "step_status"::"general_register_step_status";
EXCEPTION
  WHEN others THEN
    -- Already the correct type, or cast already applied
    NULL;
END $$;

ALTER TABLE "general_register_workflow"
  ALTER COLUMN "step_status" SET DEFAULT 'in_work';

-- Recreate partial unique index (was on 'pending', now on 'in_work')
CREATE UNIQUE INDEX IF NOT EXISTS "general_register_workflow_document_parent_to_pending_unique"
ON "general_register_workflow" ("document_id", "parent_step_id", "to_user_id", "step_status")
WHERE "step_status" = 'in_work' AND "to_user_id" IS NOT NULL;

-- Step 7: Ensure general_register_resolution_status enum exists (for general_register table)
DO $$ BEGIN
  CREATE TYPE "public"."general_register_resolution_status" AS ENUM('approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 8: Add resolution fields to general_register table (if not exist)
ALTER TABLE "general_register"
  ADD COLUMN IF NOT EXISTS "resolution_status" "general_register_resolution_status";

ALTER TABLE "general_register"
  ADD COLUMN IF NOT EXISTS "resolution" text;
