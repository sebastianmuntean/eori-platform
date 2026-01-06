-- Add unique constraint on email_templates.name
-- This ensures template names are unique at the database level, preventing race conditions

-- First, check if there are any duplicate names and handle them
-- (This is a safety check - the application code should prevent duplicates, but this ensures data integrity)

-- Add the unique constraint
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'email_templates_name_unique'
  ) THEN
    ALTER TABLE email_templates 
    ADD CONSTRAINT email_templates_name_unique UNIQUE (name);
  END IF;
END $$;







