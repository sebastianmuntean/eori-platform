-- Migration: Remove parish_id column from clients table
-- Clients should not be tied to a specific parish

DO $$
BEGIN
    -- Check if parish_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'parish_id'
    ) THEN
        -- Drop the unique constraint that includes parish_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'clients' 
            AND constraint_name LIKE '%parish%code%'
        ) THEN
            ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_unique_parish_code_unique";
            ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_parish_id_code_unique";
            RAISE NOTICE 'Dropped unique constraint on parish_id and code';
        END IF;

        -- Drop the foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'clients' 
            AND constraint_name LIKE '%parish_id%'
        ) THEN
            ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_parish_id_parishes_id_fk";
            RAISE NOTICE 'Dropped foreign key constraint on parish_id';
        END IF;

        -- Drop the parish_id column
        ALTER TABLE "clients" DROP COLUMN "parish_id";
        RAISE NOTICE 'Dropped parish_id column from clients table';
    ELSE
        RAISE NOTICE 'parish_id column does not exist in clients table, skipping';
    END IF;

    -- Create unique constraint on code only (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'clients' 
        AND constraint_name = 'clients_code_unique'
    ) THEN
        ALTER TABLE "clients" ADD CONSTRAINT "clients_code_unique" UNIQUE ("code");
        RAISE NOTICE 'Created unique constraint on code';
    ELSE
        RAISE NOTICE 'Unique constraint on code already exists';
    END IF;
END $$;

