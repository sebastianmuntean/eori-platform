-- Migration: Add Notifications module
-- This migration creates the notifications table and enum for the Notifications system

-- Create notification_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_by" uuid,
	"module" varchar(100),
	"link" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add missing columns if table already exists
DO $$ 
BEGIN
	-- Add created_by column if it doesn't exist
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_by') THEN
			ALTER TABLE "notifications" ADD COLUMN "created_by" uuid;
		END IF;
		
		-- Add module column if it doesn't exist
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'module') THEN
			ALTER TABLE "notifications" ADD COLUMN "module" varchar(100);
		END IF;
		
		-- Add link column if it doesn't exist
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link') THEN
			ALTER TABLE "notifications" ADD COLUMN "link" varchar(500);
		END IF;
		
		-- Add read_at column if it doesn't exist
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read_at') THEN
			ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp with time zone;
		END IF;
		
		-- Add updated_at column if it doesn't exist
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'updated_at') THEN
			ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
		END IF;
	END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for notifications
DO $$ BEGIN
	-- Only add constraint if column exists and constraint doesn't exist
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_schema = 'public' 
			AND table_name = 'notifications' 
			AND constraint_name = 'notifications_user_id_users_id_fk'
		) THEN
			ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
		END IF;
	END IF;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	-- Only add constraint if column exists and constraint doesn't exist
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_by') THEN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_schema = 'public' 
			AND table_name = 'notifications' 
			AND constraint_name = 'notifications_created_by_users_id_fk'
		) THEN
			ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
		END IF;
	END IF;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications" ("user_id", "is_read");
--> statement-breakpoint

