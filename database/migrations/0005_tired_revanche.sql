-- Add series column
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "series" varchar(20);

-- Add number column
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "number" numeric(10, 0);

-- Populate series and number from existing invoice_number
-- Try to extract series (prefix before dash or hyphen) and number (numeric part)
UPDATE "invoices" 
SET 
  "series" = COALESCE(
    NULLIF(REGEXP_REPLACE("invoice_number", '-.*$', ''), ''),
    'INV'
  ),
  "number" = COALESCE(
    NULLIF(
      (REGEXP_MATCH("invoice_number", '(\d+)$'))[1]::numeric,
      NULL
    ),
    1
  )
WHERE "series" IS NULL OR "number" IS NULL;

-- Set defaults for any remaining NULL values
UPDATE "invoices" SET "series" = 'INV' WHERE "series" IS NULL;
UPDATE "invoices" SET "number" = 1 WHERE "number" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "invoices" ALTER COLUMN "series" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "series" SET DEFAULT 'INV';
ALTER TABLE "invoices" ALTER COLUMN "number" SET NOT NULL;

-- Add unique constraint for parish_id, series, number, type combination
-- This ensures each invoice has a unique series+number within a parish and type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_parish_series_number_type_unique'
  ) THEN
    ALTER TABLE "invoices" 
    ADD CONSTRAINT "invoices_parish_series_number_type_unique" 
    UNIQUE("parish_id", "series", "number", "type");
  END IF;
END $$;