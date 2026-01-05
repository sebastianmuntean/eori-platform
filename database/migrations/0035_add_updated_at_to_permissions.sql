-- Migration: Add updated_at column to permissions table
-- 
-- This migration adds the missing updated_at column to the permissions table.
-- The column was defined in the schema but missing from the database.
--
-- This migration is idempotent - it can be run multiple times safely.
-- It checks for column existence before attempting to add it.

DO $$ 
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'permissions' 
      AND column_name = 'updated_at'
  ) THEN
    -- Add the column with a default value
    -- The DEFAULT now() will automatically set updated_at for existing rows
    ALTER TABLE "permissions" 
    ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    
    -- For existing rows, set updated_at to created_at if created_at exists
    -- This ensures historical data has meaningful timestamps
    UPDATE "permissions" 
    SET "updated_at" = COALESCE("created_at", now())
    WHERE "updated_at" IS NULL;
    
    RAISE NOTICE 'Successfully added updated_at column to permissions table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in permissions table - skipping';
  END IF;
END $$;

