-- Create contract_direction enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."contract_direction" AS ENUM('incoming', 'outgoing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create contract_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."contract_type" AS ENUM('rental', 'concession', 'sale_purchase', 'loan', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create contract_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'expired', 'terminated', 'renewed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create payment_frequency enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."payment_frequency" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual', 'one_time', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create contracts table
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"direction" "contract_direction" NOT NULL,
	"type" "contract_type" NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"partner_id" uuid NOT NULL,
	"title" varchar(255),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"signing_date" date,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"payment_frequency" "payment_frequency" NOT NULL,
	"asset_reference" text,
	"description" text,
	"terms" text,
	"notes" text,
	"renewal_date" date,
	"auto_renewal" boolean DEFAULT false,
	"parent_contract_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Create contract_invoices table
CREATE TABLE IF NOT EXISTS "contract_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" uuid,
	CONSTRAINT "contract_invoices_contract_id_period_year_period_month_unique" UNIQUE("contract_id","period_year","period_month")
);
--> statement-breakpoint

-- Add foreign key constraints for contracts
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_parent_contract_id_contracts_id_fk" FOREIGN KEY ("parent_contract_id") REFERENCES "contracts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for contract_invoices
DO $$ BEGIN
 ALTER TABLE "contract_invoices" ADD CONSTRAINT "contract_invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contract_invoices" ADD CONSTRAINT "contract_invoices_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contract_invoices" ADD CONSTRAINT "contract_invoices_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "contracts_parish_id_idx" ON "contracts" ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_partner_id_idx" ON "contracts" ("partner_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_contract_number_idx" ON "contracts" ("contract_number");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_start_date_idx" ON "contracts" ("start_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_end_date_idx" ON "contracts" ("end_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_type_idx" ON "contracts" ("type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_status_idx" ON "contracts" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_direction_idx" ON "contracts" ("direction");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contracts_payment_frequency_idx" ON "contracts" ("payment_frequency");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contract_invoices_contract_id_idx" ON "contract_invoices" ("contract_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contract_invoices_invoice_id_idx" ON "contract_invoices" ("invoice_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contract_invoices_period_idx" ON "contract_invoices" ("contract_id", "period_year", "period_month");
