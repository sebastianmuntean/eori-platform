-- Add missing columns to stock_movements table if they don't exist
-- This migration ensures all required columns exist even if the table was created from an old migration

DO $$ BEGIN
  -- Add invoice_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "invoice_id" uuid;
  END IF;

  -- Add invoice_item_index column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'invoice_item_index'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "invoice_item_index" integer;
  END IF;

  -- Add unit_cost column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "unit_cost" numeric(15, 4);
  END IF;

  -- Add total_value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'total_value'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "total_value" numeric(15, 2);
  END IF;

  -- Add destination_warehouse_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'destination_warehouse_id'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "destination_warehouse_id" uuid;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "created_by" uuid;
    -- Set a default user ID if available
    UPDATE "stock_movements" SET "created_by" = (SELECT id FROM users LIMIT 1) WHERE "created_by" IS NULL;
    -- Make NOT NULL only if we have a default value
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
      ALTER TABLE "stock_movements" ALTER COLUMN "created_by" SET NOT NULL;
    END IF;
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "stock_movements" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
    UPDATE "stock_movements" SET "created_at" = now() WHERE "created_at" IS NULL;
    ALTER TABLE "stock_movements" ALTER COLUMN "created_at" SET NOT NULL;
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stock_movements_invoice_id_invoices_id_fk'
  ) THEN
    ALTER TABLE "stock_movements" 
    ADD CONSTRAINT "stock_movements_invoice_id_invoices_id_fk" 
    FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_stock_movements_invoice" 
ON "stock_movements" USING btree ("invoice_id") 
WHERE "invoice_id" IS NOT NULL;


