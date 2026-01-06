-- Create payment_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_type" AS ENUM('income', 'expense');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payment_method enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'card', 'check');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payment_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payments table
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"type" "payment_type" NOT NULL,
	"category" varchar(100),
	"partner_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"description" text,
	"payment_method" "payment_method",
	"reference_number" varchar(100),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "payments_parish_id_idx" ON "payments" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "payments_date_idx" ON "payments" ("date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "payments_type_idx" ON "payments" ("type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "payments_payment_number_idx" ON "payments" ("payment_number");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "payments_partner_id_idx" ON "payments" ("partner_id");









