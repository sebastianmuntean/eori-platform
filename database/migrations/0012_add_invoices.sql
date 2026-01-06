-- Create invoice_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."invoice_type" AS ENUM('issued', 'received');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create invoice_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"type" "invoice_type" NOT NULL,
	"date" date NOT NULL,
	"due_date" date NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"vat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"payment_date" date,
	"description" text,
	"items" jsonb DEFAULT '[]',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "invoices_parish_id_idx" ON "invoices" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_date_idx" ON "invoices" ("date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices" ("due_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_type_idx" ON "invoices" ("type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" ("invoice_number");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoices_partner_id_idx" ON "invoices" ("partner_id");









