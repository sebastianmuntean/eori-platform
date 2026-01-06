-- Migration to remove the 'direction' column from invoices table
-- This column was replaced by 'type' in migration 0013
-- We need to ensure it's removed or made nullable to avoid constraint violations

DO $$ 
BEGIN
    -- Check if direction column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'direction'
    ) THEN
        -- First, make it nullable if it's not already
        ALTER TABLE "invoices" ALTER COLUMN "direction" DROP NOT NULL;
        
        -- Set default value for any NULL values (shouldn't happen, but just in case)
        UPDATE "invoices" SET "direction" = 'out' WHERE "direction" IS NULL;
        
        -- Drop the column
        ALTER TABLE "invoices" DROP COLUMN "direction";
        
        RAISE NOTICE 'Column "direction" removed from invoices table';
    ELSE
        RAISE NOTICE 'Column "direction" does not exist in invoices table';
    END IF;
END $$;









