-- Add invoice_series column to warehouses table
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "invoice_series" varchar(20);

