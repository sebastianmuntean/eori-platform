-- Migration: Remove purchase_price and sale_price columns from products table
-- Products should not have fixed prices - prices are set at invoice level

DO $$
BEGIN
    -- Check if purchase_price column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'purchase_price'
    ) THEN
        ALTER TABLE "products" DROP COLUMN "purchase_price";
        RAISE NOTICE 'Dropped purchase_price column from products table';
    ELSE
        RAISE NOTICE 'purchase_price column does not exist in products table, skipping';
    END IF;

    -- Check if sale_price column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'sale_price'
    ) THEN
        ALTER TABLE "products" DROP COLUMN "sale_price";
        RAISE NOTICE 'Dropped sale_price column from products table';
    ELSE
        RAISE NOTICE 'sale_price column does not exist in products table, skipping';
    END IF;
END $$;

