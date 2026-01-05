-- Migration to add partner_category enum and category column to partners table

-- Create partner_category enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_category') THEN
        CREATE TYPE "public"."partner_category" AS ENUM('supplier', 'client', 'both', 'other');
        RAISE NOTICE 'Created partner_category enum type';
    ELSE
        RAISE NOTICE 'partner_category enum type already exists';
    END IF;
END $$;

-- Add category column to partners table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'partners' 
        AND column_name = 'category'
    ) THEN
        -- Add the category column with default value
        ALTER TABLE "partners" 
        ADD COLUMN "category" "partner_category" DEFAULT 'other' NOT NULL;
        
        RAISE NOTICE 'Added category column to partners table';
    ELSE
        RAISE NOTICE 'Category column already exists in partners table';
    END IF;
END $$;





