-- Migration: Increase verification_code column length from 10 to 255
-- This allows storing longer, more secure verification tokens (64-character hex strings)
-- Generated to fix security issue where verification tokens exceeded schema limit

-- Alter the verification_code column to support longer tokens
ALTER TABLE "users" 
ALTER COLUMN "verification_code" TYPE varchar(255);

-- Add comment to document the change
COMMENT ON COLUMN "users"."verification_code" IS 'Verification token for email confirmation (up to 255 characters)';







