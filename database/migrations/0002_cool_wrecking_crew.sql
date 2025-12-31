DO $$ BEGIN
 CREATE TYPE "template_category" AS ENUM('predefined', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" "template_category" DEFAULT 'custom' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
