-- Restore address, city, phone columns to users table
-- These columns were dropped in migration 0005 but are needed

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;




