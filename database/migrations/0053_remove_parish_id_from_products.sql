-- Migration: Remove parish_id column from products table
-- Products are generic and should not be tied to a specific parish
-- Only stock movements have parish_id and warehouse_id for stock management

DO $$
BEGIN
    -- Check if parish_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'parish_id'
    ) THEN
        -- Drop the unique constraint that includes parish_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'products' 
            AND constraint_name LIKE '%parish%code%'
        ) THEN
            ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_parish_id_code_unique";
            ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_unique_parish_code_unique";
            RAISE NOTICE 'Dropped unique constraint on parish_id and code';
        END IF;

        -- Drop the foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'products' 
            AND constraint_name LIKE '%parish_id%'
        ) THEN
            ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_parish_id_parishes_id_fk";
            RAISE NOTICE 'Dropped foreign key constraint on parish_id';
        END IF;

        -- Drop indexes that include parish_id
        DROP INDEX IF EXISTS "idx_products_parish";
        DROP INDEX IF EXISTS "idx_products_active";
        DROP INDEX IF EXISTS "idx_products_category";
        RAISE NOTICE 'Dropped indexes that include parish_id';

        -- Drop the parish_id column
        ALTER TABLE "products" DROP COLUMN "parish_id";
        RAISE NOTICE 'Dropped parish_id column from products table';
    ELSE
        RAISE NOTICE 'parish_id column does not exist in products table, skipping';
    END IF;

    -- Create unique constraint on code only (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'products' 
        AND constraint_name = 'products_code_unique'
    ) THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_code_unique" UNIQUE ("code");
        RAISE NOTICE 'Created unique constraint on code';
    ELSE
        RAISE NOTICE 'Unique constraint on code already exists';
    END IF;

    -- Create indexes for performance (without parish_id)
    CREATE INDEX IF NOT EXISTS "idx_products_active" ON "products" USING btree ("is_active");
    CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" USING btree ("category") WHERE "category" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS "idx_products_barcode" ON "products" USING btree ("barcode") WHERE "barcode" IS NOT NULL;
    RAISE NOTICE 'Created indexes for products table';
END $$;

