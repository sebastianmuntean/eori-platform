-- Create document_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('incoming', 'outgoing', 'internal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Note: document_status enum may already exist from migration 0005
-- If it exists, verify it includes: 'draft', 'registered', 'archived'
-- The existing enum has: 'draft', 'registered', 'distributed', 'processing', 'completed', 'archived'
-- Since it includes our needed values, we can use the existing enum
-- If you need only our values, you would need to drop and recreate (not recommended if used elsewhere)
DO $$ BEGIN
 CREATE TYPE "public"."document_status" AS ENUM('draft', 'registered', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create general_register table
CREATE TABLE IF NOT EXISTS "general_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"document_type" "document_type" NOT NULL,
	"date" date NOT NULL,
	"subject" varchar(500) NOT NULL,
	"from" varchar(255),
	"to" varchar(255),
	"description" text,
	"file_path" text,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "general_register" ADD CONSTRAINT "general_register_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "general_register" ADD CONSTRAINT "general_register_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "general_register" ADD CONSTRAINT "general_register_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "general_register_parish_id_idx" ON "general_register" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_document_type_idx" ON "general_register" ("document_type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_status_idx" ON "general_register" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_date_idx" ON "general_register" ("date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "general_register_document_number_idx" ON "general_register" ("document_number");

