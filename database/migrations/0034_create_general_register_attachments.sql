-- Migration: Create general_register_attachments table
-- This table stores file attachments for general register documents

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS "general_register_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "general_register"("id") ON DELETE CASCADE,
  "workflow_step_id" uuid REFERENCES "general_register_workflow"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "storage_name" varchar(255) NOT NULL,
  "storage_path" text NOT NULL,
  "mime_type" varchar(100),
  "file_size" bigint NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_signed" boolean NOT NULL DEFAULT false,
  "signed_by" uuid REFERENCES "users"("id"),
  "signed_at" timestamp with time zone,
  "uploaded_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Create index on document_id for faster queries
CREATE INDEX IF NOT EXISTS "general_register_attachments_document_id_idx" ON "general_register_attachments"("document_id");

-- Create index on workflow_step_id for faster queries
CREATE INDEX IF NOT EXISTS "general_register_attachments_workflow_step_id_idx" ON "general_register_attachments"("workflow_step_id");

-- Create index on uploaded_by for faster queries
CREATE INDEX IF NOT EXISTS "general_register_attachments_uploaded_by_idx" ON "general_register_attachments"("uploaded_by");







