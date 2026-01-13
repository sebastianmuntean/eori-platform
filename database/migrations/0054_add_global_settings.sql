-- Migration: Add global_settings table for system-wide configuration
-- This table stores global application settings like default VAT rate

CREATE TABLE IF NOT EXISTS "global_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);

-- Create unique constraint on key
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_key_unique" UNIQUE ("key");

-- Add foreign key constraint for updated_by
DO $$ BEGIN
 ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Insert default VAT rate setting
INSERT INTO "global_settings" ("key", "value", "description", "updated_at")
VALUES ('default_vat_rate', '19', 'Cota TVA implicită (în procente)', now())
ON CONFLICT ("key") DO NOTHING;

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS "idx_global_settings_key" ON "global_settings" USING btree ("key");

