-- Create departments table
CREATE TABLE IF NOT EXISTS "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"head_name" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraint to parishes
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create unique index on code per parish (code must be unique within a parish)
CREATE UNIQUE INDEX IF NOT EXISTS "departments_parish_id_code_unique" ON "departments" ("parish_id", "code");
--> statement-breakpoint

-- Create index on parish_id for faster lookups
CREATE INDEX IF NOT EXISTS "departments_parish_id_idx" ON "departments" ("parish_id");
--> statement-breakpoint

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS "departments_is_active_idx" ON "departments" ("is_active");

