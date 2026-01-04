-- Create receipt_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."receipt_status" AS ENUM('draft', 'issued', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create parishioner_contract_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."parishioner_contract_type" AS ENUM('donation', 'service', 'rental', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create parishioner_contract_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."parishioner_contract_status" AS ENUM('draft', 'active', 'expired', 'terminated', 'renewed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create contract_document_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."contract_document_type" AS ENUM('contract', 'amendment', 'renewal', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create parishioner_types table
CREATE TABLE IF NOT EXISTS "parishioner_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Create receipts table
CREATE TABLE IF NOT EXISTS "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"parishioner_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"receipt_date" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"purpose" text,
	"payment_method" varchar(50),
	"status" "receipt_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"issued_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Create receipt_attachments table
CREATE TABLE IF NOT EXISTS "receipt_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" bigint NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create parishioner_contracts table
CREATE TABLE IF NOT EXISTS "parishioner_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"parishioner_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"contract_type" "parishioner_contract_type" NOT NULL,
	"status" "parishioner_contract_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255),
	"start_date" date NOT NULL,
	"end_date" date,
	"signing_date" date,
	"amount" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'RON',
	"terms" text,
	"description" text,
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

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS "contract_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" bigint NOT NULL,
	"document_type" "contract_document_type" DEFAULT 'contract' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add parishioner-specific columns to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "is_parishioner" boolean DEFAULT false;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "parishioner_type_id" uuid;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "name_day" date;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "parish_id" uuid;
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "parishioner_types" ADD CONSTRAINT "parishioner_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_types" ADD CONSTRAINT "parishioner_types_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_parishioner_id_clients_id_fk" FOREIGN KEY ("parishioner_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipt_attachments" ADD CONSTRAINT "receipt_attachments_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "receipt_attachments" ADD CONSTRAINT "receipt_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_parishioner_id_clients_id_fk" FOREIGN KEY ("parishioner_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_parent_contract_id_parishioner_contracts_id_fk" FOREIGN KEY ("parent_contract_id") REFERENCES "public"."parishioner_contracts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_parishioner_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."parishioner_contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "clients_parishioner_type_id_parishioner_types_id_fk" FOREIGN KEY ("parishioner_type_id") REFERENCES "public"."parishioner_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "clients_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create unique constraints
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioner_contracts" ADD CONSTRAINT "parishioner_contracts_contract_number_unique" UNIQUE("contract_number");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes
CREATE INDEX IF NOT EXISTS "receipts_parishioner_id_idx" ON "receipts" ("parishioner_id");
CREATE INDEX IF NOT EXISTS "receipts_parish_id_idx" ON "receipts" ("parish_id");
CREATE INDEX IF NOT EXISTS "receipts_receipt_date_idx" ON "receipts" ("receipt_date");
CREATE INDEX IF NOT EXISTS "receipt_attachments_receipt_id_idx" ON "receipt_attachments" ("receipt_id");
CREATE INDEX IF NOT EXISTS "parishioner_contracts_parishioner_id_idx" ON "parishioner_contracts" ("parishioner_id");
CREATE INDEX IF NOT EXISTS "parishioner_contracts_parish_id_idx" ON "parishioner_contracts" ("parish_id");
CREATE INDEX IF NOT EXISTS "parishioner_contracts_start_date_idx" ON "parishioner_contracts" ("start_date");
CREATE INDEX IF NOT EXISTS "contract_documents_contract_id_idx" ON "contract_documents" ("contract_id");
CREATE INDEX IF NOT EXISTS "clients_parishioner_type_id_idx" ON "clients" ("parishioner_type_id");
CREATE INDEX IF NOT EXISTS "clients_parish_id_idx" ON "clients" ("parish_id");
CREATE INDEX IF NOT EXISTS "clients_name_day_idx" ON "clients" ("name_day");
CREATE INDEX IF NOT EXISTS "clients_is_parishioner_idx" ON "clients" ("is_parishioner");

