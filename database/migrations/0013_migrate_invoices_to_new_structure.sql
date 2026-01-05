-- Migration to update invoices table from old structure to new structure
-- This migration handles the transition from the old invoice structure (series/number)
-- to the new structure (invoice_number)

-- Step 0: Create required enums if they don't exist
-- Note: We check if they exist first to avoid conflicts with old enum definitions

-- Create invoice_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'invoice_type'
    ) THEN
        CREATE TYPE "public"."invoice_type" AS ENUM('issued', 'received');
    END IF;
END $$;

-- Handle invoice_status enum - the old migration has different values
-- Old: 'draft', 'issued', 'sent', 'paid', 'partial', 'cancelled', 'overdue'
-- New: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
-- We'll create it only if it doesn't exist, otherwise use the existing one
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'invoice_status'
    ) THEN
        CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');
    END IF;
END $$;

-- Step 1: Check if invoice_number column exists, if not add it
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'invoice_number'
    ) THEN
        -- Add invoice_number column
        ALTER TABLE "invoices" ADD COLUMN "invoice_number" varchar(50);
        
        -- Populate invoice_number from series and number if they exist
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'invoices' 
            AND column_name = 'series'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_name = 'number'
        ) THEN
            -- Generate invoice_number from series and number
            UPDATE "invoices" 
            SET "invoice_number" = COALESCE("series", '') || '-' || LPAD("number"::text, 6, '0')
            WHERE "invoice_number" IS NULL;
        END IF;
        
        -- Make invoice_number NOT NULL after populating
        ALTER TABLE "invoices" ALTER COLUMN "invoice_number" SET NOT NULL;
    END IF;
END $$;

-- Step 2: Add missing columns from new structure if they don't exist
DO $$ 
BEGIN
    -- Add 'date' column if it doesn't exist (migrate from 'issue_date' if it exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'date'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "date" date;
        
        -- Migrate data from issue_date if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'issue_date'
        ) THEN
            UPDATE "invoices" SET "date" = "issue_date" WHERE "date" IS NULL;
        END IF;
        
        ALTER TABLE "invoices" ALTER COLUMN "date" SET NOT NULL;
    END IF;
    
    -- Add 'amount' column if it doesn't exist (migrate from 'subtotal' if it exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'amount'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "amount" numeric(10, 2);
        
        -- Migrate data from subtotal if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'subtotal'
        ) THEN
            UPDATE "invoices" SET "amount" = "subtotal" WHERE "amount" IS NULL;
        END IF;
        
        ALTER TABLE "invoices" ALTER COLUMN "amount" SET NOT NULL;
    END IF;
    
    -- Add 'vat' column if it doesn't exist (migrate from 'vat_amount' if it exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'vat'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "vat" numeric(10, 2) DEFAULT '0';
        
        -- Migrate data from vat_amount if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'vat_amount'
        ) THEN
            UPDATE "invoices" SET "vat" = COALESCE("vat_amount", 0) WHERE "vat" IS NULL;
        END IF;
        
        ALTER TABLE "invoices" ALTER COLUMN "vat" SET NOT NULL;
    END IF;
    
    -- Add 'description' column if it doesn't exist (migrate from 'notes' if it exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'description'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "description" text;
        
        -- Migrate data from notes if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'notes'
        ) THEN
            UPDATE "invoices" SET "description" = "notes" WHERE "description" IS NULL;
        END IF;
    END IF;
    
    -- Add 'items' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'items'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "items" jsonb DEFAULT '[]';
    END IF;
    
    -- Add 'payment_date' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_date'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "payment_date" date;
    END IF;
END $$;

-- Step 3: Update 'type' column if 'direction' exists and needs migration
DO $$ 
BEGIN
    -- If direction exists but type doesn't, we need to handle the enum conversion
    -- The invoice_type enum should have been created in Step 0 above
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'direction'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'type'
    ) THEN
        -- Add type column
        ALTER TABLE "invoices" ADD COLUMN "type" "invoice_type";
        
        -- Migrate: 'out' -> 'issued', 'in' -> 'received'
        UPDATE "invoices" SET "type" = 'issued' WHERE "direction" = 'out';
        UPDATE "invoices" SET "type" = 'received' WHERE "direction" = 'in';
        
        ALTER TABLE "invoices" ALTER COLUMN "type" SET NOT NULL;
    END IF;
END $$;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" ("invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_date_idx" ON "invoices" ("date");
CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices" ("due_date");
CREATE INDEX IF NOT EXISTS "invoices_type_idx" ON "invoices" ("type");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "invoices_parish_id_idx" ON "invoices" ("parish_id");
CREATE INDEX IF NOT EXISTS "invoices_partner_id_idx" ON "invoices" ("partner_id");

