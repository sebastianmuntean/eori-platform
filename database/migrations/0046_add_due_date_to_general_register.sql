-- Migration: Add due_date column to general_register table
-- This column stores the due date for document processing (optional)

-- Add due_date column
ALTER TABLE "general_register" 
ADD COLUMN IF NOT EXISTS "due_date" date;
--> statement-breakpoint

