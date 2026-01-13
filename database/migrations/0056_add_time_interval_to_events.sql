-- Migration: Add start_time and end_time columns to church_events table
-- These columns store the time interval for events (from hour to hour)

DO $$
BEGIN
    -- Check if start_time column exists and add it if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'church_events' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE "church_events" ADD COLUMN "start_time" TIME;
        RAISE NOTICE 'Added start_time column to church_events table';
    ELSE
        RAISE NOTICE 'start_time column already exists in church_events table, skipping';
    END IF;

    -- Check if end_time column exists and add it if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'church_events' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE "church_events" ADD COLUMN "end_time" TIME;
        RAISE NOTICE 'Added end_time column to church_events table';
    ELSE
        RAISE NOTICE 'end_time column already exists in church_events table, skipping';
    END IF;
END $$;

