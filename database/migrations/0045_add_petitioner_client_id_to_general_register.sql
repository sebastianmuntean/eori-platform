-- Migration: Add petitioner_client_id column to general_register table
-- This column links documents to clients who are petitioners

-- Add petitioner_client_id column
ALTER TABLE "general_register" 
ADD COLUMN IF NOT EXISTS "petitioner_client_id" uuid;
--> statement-breakpoint

-- Add foreign key constraint to clients table
DO $$ BEGIN
 ALTER TABLE "general_register" 
 ADD CONSTRAINT "general_register_petitioner_client_id_clients_id_fk" 
 FOREIGN KEY ("petitioner_client_id") 
 REFERENCES "public"."clients"("id") 
 ON DELETE set null 
 ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "general_register_petitioner_client_id_idx" 
ON "general_register" ("petitioner_client_id");
--> statement-breakpoint

