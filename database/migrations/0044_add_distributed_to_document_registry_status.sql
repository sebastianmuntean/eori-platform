-- Migration: Add 'distributed' and 'cancelled' to document_registry_status enum
-- This fixes the issue where document_registry table uses document_registry_status enum
-- which was missing these values that are used in the application code

-- Add 'distributed' to document_registry_status enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if document_registry_status enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_registry_status') THEN
        -- Add 'distributed' if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'distributed' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_registry_status')
        ) THEN
            ALTER TYPE "public"."document_registry_status" ADD VALUE 'distributed';
        END IF;

        -- Add 'cancelled' if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'cancelled' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_registry_status')
        ) THEN
            ALTER TYPE "public"."document_registry_status" ADD VALUE 'cancelled';
        END IF;
    END IF;
END $$;
--> statement-breakpoint

