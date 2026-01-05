-- Migration 0005: Core tables (dioceses, deaneries, parishes, partners, cemeteries, library, events)
-- This migration creates the core tables needed for the application
-- All table and column names are in English

-- ============================================
-- ENUMS
-- ============================================

-- User role enum (needed for users table)
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('episcop', 'vicar', 'paroh', 'secretar', 'contabil');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Approval status enum (needed for users table)
DO $$ BEGIN
 CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Partner type enum
DO $$ BEGIN
 CREATE TYPE "public"."partner_type" AS ENUM('person', 'company', 'organization');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Grave status enum
DO $$ BEGIN
 CREATE TYPE "public"."grave_status" AS ENUM('free', 'occupied', 'reserved', 'maintenance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Concession status enum
DO $$ BEGIN
 CREATE TYPE "public"."concession_status" AS ENUM('active', 'expired', 'cancelled', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Event type enum
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('wedding', 'baptism', 'funeral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Event status enum
DO $$ BEGIN
 CREATE TYPE "public"."event_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Participant role enum
DO $$ BEGIN
 CREATE TYPE "public"."participant_role" AS ENUM('bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Email submission status enum
DO $$ BEGIN
 CREATE TYPE "public"."email_submission_status" AS ENUM('pending', 'processed', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Book status enum
DO $$ BEGIN
 CREATE TYPE "public"."book_status" AS ENUM('available', 'borrowed', 'reserved', 'damaged', 'lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Loan status enum
DO $$ BEGIN
 CREATE TYPE "public"."loan_status" AS ENUM('active', 'returned', 'overdue', 'lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================
-- CORE TABLES
-- ============================================

-- Dioceses table
CREATE TABLE IF NOT EXISTS "dioceses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"country" varchar(100) DEFAULT 'România',
	"phone" varchar(50),
	"email" varchar(255),
	"website" varchar(255),
	"bishop_name" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dioceses_code_unique" UNIQUE("code")
);
--> statement-breakpoint

-- Deaneries table
CREATE TABLE IF NOT EXISTS "deaneries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diocese_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"dean_name" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deaneries_diocese_code_unique" UNIQUE("diocese_id","code")
);
--> statement-breakpoint

-- Parishes table
CREATE TABLE IF NOT EXISTS "parishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deanery_id" uuid,
	"diocese_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"patron_saint_day" date,
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"postal_code" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"phone" varchar(50),
	"email" varchar(255),
	"website" varchar(255),
	"priest_name" varchar(255),
	"vicar_name" varchar(255),
	"parishioner_count" integer,
	"founded_year" integer,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parishes_code_unique" UNIQUE("code")
);
--> statement-breakpoint

-- Partners table
CREATE TABLE IF NOT EXISTS "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "partner_type" DEFAULT 'person' NOT NULL,
	"code" varchar(50) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"cnp" varchar(13),
	"birth_date" date,
	"company_name" varchar(255),
	"cui" varchar(20),
	"reg_com" varchar(50),
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"postal_code" varchar(20),
	"phone" varchar(50),
	"email" varchar(255),
	"bank_name" varchar(255),
	"iban" varchar(34),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "partners_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Parishioner classifications table
CREATE TABLE IF NOT EXISTS "parishioner_classifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint

-- Parishioners table
CREATE TABLE IF NOT EXISTS "parishioners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"partner_id" uuid,
	"code" serial NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"birth_date" date,
	"profession" varchar(255),
	"occupation" varchar(255),
	"marital_status" varchar(255),
	"phone" varchar(255),
	"email" varchar(255),
	"notes" text,
	"classification" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parishioners_code_unique" UNIQUE("code")
);
--> statement-breakpoint

-- ============================================
-- CEMETERIES TABLES
-- ============================================

-- Cemeteries table
CREATE TABLE IF NOT EXISTS "cemeteries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"total_area" numeric(10, 2),
	"total_plots" integer,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemeteries_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Cemetery parcels table
CREATE TABLE IF NOT EXISTS "cemetery_parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemetery_parcels_cemetery_code_unique" UNIQUE("cemetery_id","code")
);
--> statement-breakpoint

-- Cemetery rows table
CREATE TABLE IF NOT EXISTS "cemetery_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemetery_rows_parcel_code_unique" UNIQUE("parcel_id","code")
);
--> statement-breakpoint

-- Cemetery graves table
CREATE TABLE IF NOT EXISTS "cemetery_graves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"row_id" uuid NOT NULL,
	"parcel_id" uuid NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"status" "grave_status" DEFAULT 'free',
	"width" numeric(5, 2),
	"length" numeric(5, 2),
	"position_x" integer,
	"position_y" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemetery_graves_row_code_unique" UNIQUE("row_id","code")
);
--> statement-breakpoint

-- Concessions table
CREATE TABLE IF NOT EXISTS "concessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grave_id" uuid NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"holder_partner_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_date" date NOT NULL,
	"start_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"duration_years" integer NOT NULL,
	"annual_fee" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"status" "concession_status" DEFAULT 'active',
	"is_expired" boolean DEFAULT false,
	"expires_in_days" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "concessions_parish_contract_unique" UNIQUE("parish_id","contract_number")
);
--> statement-breakpoint

-- Concession payments table
CREATE TABLE IF NOT EXISTS "concession_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concession_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"receipt_number" varchar(50),
	"receipt_date" date,
	"transaction_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint

-- Burials table
-- Note: If this table was created by old migration, it may not have cemetery_id column
-- The section below will add it if missing
CREATE TABLE IF NOT EXISTS "burials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grave_id" uuid NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"deceased_partner_id" uuid,
	"deceased_name" varchar(255) NOT NULL,
	"deceased_birth_date" date,
	"deceased_death_date" date NOT NULL,
	"burial_date" date NOT NULL,
	"burial_certificate_number" varchar(50),
	"burial_certificate_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Add missing columns if burials table exists from old migration and doesn't have these columns
-- WARNING: If table has existing data, you need to populate these columns manually before adding FK constraints
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'burials') THEN
    -- Add cemetery_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'cemetery_id') THEN
      ALTER TABLE "burials" ADD COLUMN "cemetery_id" uuid;
      -- If table is empty, you can make it NOT NULL, otherwise populate it first
      -- ALTER TABLE "burials" ALTER COLUMN "cemetery_id" SET NOT NULL;
    END IF;
    
    -- Add deceased_partner_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'deceased_partner_id') THEN
      ALTER TABLE "burials" ADD COLUMN "deceased_partner_id" uuid;
    END IF;
    
    -- Update column names if they differ (old migration had different names)
    -- death_certificate_number -> burial_certificate_number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'death_certificate_number') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'burial_certificate_number') THEN
        ALTER TABLE "burials" RENAME COLUMN "death_certificate_number" TO "burial_certificate_number";
      END IF;
    END IF;
    
    -- death_certificate_date -> burial_certificate_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'death_certificate_date') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'burial_certificate_date') THEN
        ALTER TABLE "burials" RENAME COLUMN "death_certificate_date" TO "burial_certificate_date";
      END IF;
    END IF;
    
    -- Remove old column death_certificate_issuer if exists (not in new schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'death_certificate_issuer') THEN
      ALTER TABLE "burials" DROP COLUMN IF EXISTS "death_certificate_issuer";
    END IF;
    
    -- Add updated_at and updated_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'updated_at') THEN
      ALTER TABLE "burials" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'burials' AND column_name = 'updated_by') THEN
      ALTER TABLE "burials" ADD COLUMN "updated_by" uuid;
    END IF;
  END IF;
END $$;
--> statement-breakpoint

-- ============================================
-- LIBRARY TABLES
-- ============================================

-- Library authors table
CREATE TABLE IF NOT EXISTS "library_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"biography" text,
	"birth_year" integer,
	"death_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_authors_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Library publishers table
CREATE TABLE IF NOT EXISTS "library_publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"website" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_publishers_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Library domains table
CREATE TABLE IF NOT EXISTS "library_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_domains_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Library books table
CREATE TABLE IF NOT EXISTS "library_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"author_id" uuid,
	"publisher_id" uuid,
	"domain_id" uuid,
	"isbn" varchar(20),
	"publication_year" integer,
	"pages" integer,
	"copies" integer DEFAULT 1,
	"available_copies" integer DEFAULT 1,
	"location" varchar(100),
	"status" "book_status" DEFAULT 'available',
	"is_loanable" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_books_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Library loans table
CREATE TABLE IF NOT EXISTS "library_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"borrower_partner_id" uuid NOT NULL,
	"loan_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" "loan_status" DEFAULT 'active',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint

-- ============================================
-- EVENTS TABLES
-- ============================================

-- Church events table
CREATE TABLE IF NOT EXISTS "church_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "event_type" NOT NULL,
	"status" "event_status" DEFAULT 'pending' NOT NULL,
	"event_date" date,
	"location" varchar(255),
	"priest_name" varchar(255),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint

-- Church event participants table
CREATE TABLE IF NOT EXISTS "church_event_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"parishioner_id" uuid,
	"role" "participant_role" NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"birth_date" date,
	"cnp" varchar(13),
	"address" text,
	"city" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Church event documents table
CREATE TABLE IF NOT EXISTS "church_event_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50),
	"file_size" varchar(50),
	"description" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Church event email submissions table
CREATE TABLE IF NOT EXISTS "church_event_email_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"from_email" varchar(255) NOT NULL,
	"subject" varchar(500),
	"content" text NOT NULL,
	"status" "email_submission_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Deaneries -> Dioceses
DO $$ BEGIN
 ALTER TABLE "deaneries" ADD CONSTRAINT "deaneries_diocese_id_dioceses_id_fk" FOREIGN KEY ("diocese_id") REFERENCES "dioceses"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Parishes -> Deaneries and Dioceses
DO $$ BEGIN
 ALTER TABLE "parishes" ADD CONSTRAINT "parishes_deanery_id_deaneries_id_fk" FOREIGN KEY ("deanery_id") REFERENCES "deaneries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishes" ADD CONSTRAINT "parishes_diocese_id_dioceses_id_fk" FOREIGN KEY ("diocese_id") REFERENCES "dioceses"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Partners -> Parishes and Users
DO $$ BEGIN
 ALTER TABLE "partners" ADD CONSTRAINT "partners_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "partners" ADD CONSTRAINT "partners_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Parishioners -> Parishes and Partners
DO $$ BEGIN
 ALTER TABLE "parishioners" ADD CONSTRAINT "parishioners_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "parishioners" ADD CONSTRAINT "parishioners_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Cemeteries -> Parishes
DO $$ BEGIN
 ALTER TABLE "cemeteries" ADD CONSTRAINT "cemeteries_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Cemetery parcels -> Cemeteries and Parishes
DO $$ BEGIN
 ALTER TABLE "cemetery_parcels" ADD CONSTRAINT "cemetery_parcels_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "cemeteries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_parcels" ADD CONSTRAINT "cemetery_parcels_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Cemetery rows -> Parcels, Cemeteries, and Parishes
DO $$ BEGIN
 ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_parcel_id_cemetery_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "cemetery_parcels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "cemeteries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Cemetery graves -> Rows, Parcels, Cemeteries, and Parishes
DO $$ BEGIN
 ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_row_id_cemetery_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "cemetery_rows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_parcel_id_cemetery_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "cemetery_parcels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "cemeteries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Concessions -> Graves, Cemeteries, Parishes, Partners, and Users
DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_grave_id_cemetery_graves_id_fk" FOREIGN KEY ("grave_id") REFERENCES "cemetery_graves"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "cemeteries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_holder_partner_id_partners_id_fk" FOREIGN KEY ("holder_partner_id") REFERENCES "partners"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concessions" ADD CONSTRAINT "concessions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Concession payments -> Concessions, Parishes, and Users
DO $$ BEGIN
 ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_concession_id_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "concessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Burials -> Graves, Cemeteries, Parishes, Partners, and Users
DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_grave_id_cemetery_graves_id_fk" FOREIGN KEY ("grave_id") REFERENCES "cemetery_graves"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "cemeteries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_deceased_partner_id_partners_id_fk" FOREIGN KEY ("deceased_partner_id") REFERENCES "partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "burials" ADD CONSTRAINT "burials_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Library authors -> Parishes
DO $$ BEGIN
 ALTER TABLE "library_authors" ADD CONSTRAINT "library_authors_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Library publishers -> Parishes
DO $$ BEGIN
 ALTER TABLE "library_publishers" ADD CONSTRAINT "library_publishers_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Library domains -> Parishes and self-reference
DO $$ BEGIN
 ALTER TABLE "library_domains" ADD CONSTRAINT "library_domains_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_domains" ADD CONSTRAINT "library_domains_parent_id_library_domains_id_fk" FOREIGN KEY ("parent_id") REFERENCES "library_domains"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Library books -> Parishes, Authors, Publishers, and Domains
DO $$ BEGIN
 ALTER TABLE "library_books" ADD CONSTRAINT "library_books_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_books" ADD CONSTRAINT "library_books_author_id_library_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "library_authors"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_books" ADD CONSTRAINT "library_books_publisher_id_library_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "library_publishers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_books" ADD CONSTRAINT "library_books_domain_id_library_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "library_domains"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Library loans -> Parishes, Books, Partners, and Users
DO $$ BEGIN
 ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_borrower_partner_id_partners_id_fk" FOREIGN KEY ("borrower_partner_id") REFERENCES "partners"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Church events -> Parishes and Users
DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_events" ADD CONSTRAINT "church_events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Church event participants -> Events and Parishioners
DO $$ BEGIN
 ALTER TABLE "church_event_participants" ADD CONSTRAINT "church_event_participants_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_event_participants" ADD CONSTRAINT "church_event_participants_parishioner_id_parishioners_id_fk" FOREIGN KEY ("parishioner_id") REFERENCES "parishioners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Church event documents -> Events and Users
DO $$ BEGIN
 ALTER TABLE "church_event_documents" ADD CONSTRAINT "church_event_documents_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "church_event_documents" ADD CONSTRAINT "church_event_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Church event email submissions -> Events
DO $$ BEGIN
 ALTER TABLE "church_event_email_submissions" ADD CONSTRAINT "church_event_email_submissions_event_id_church_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "church_events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================
-- INDEXES
-- ============================================

-- Dioceses indexes
CREATE INDEX IF NOT EXISTS "dioceses_code_idx" ON "dioceses" ("code");
CREATE INDEX IF NOT EXISTS "dioceses_is_active_idx" ON "dioceses" ("is_active");
--> statement-breakpoint

-- Deaneries indexes
CREATE INDEX IF NOT EXISTS "deaneries_diocese_id_idx" ON "deaneries" ("diocese_id");
CREATE INDEX IF NOT EXISTS "deaneries_is_active_idx" ON "deaneries" ("is_active");
--> statement-breakpoint

-- Parishes indexes
CREATE INDEX IF NOT EXISTS "parishes_deanery_id_idx" ON "parishes" ("deanery_id");
CREATE INDEX IF NOT EXISTS "parishes_diocese_id_idx" ON "parishes" ("diocese_id");
CREATE INDEX IF NOT EXISTS "parishes_is_active_idx" ON "parishes" ("is_active");
CREATE INDEX IF NOT EXISTS "parishes_city_idx" ON "parishes" ("city");
CREATE INDEX IF NOT EXISTS "parishes_county_idx" ON "parishes" ("county");
--> statement-breakpoint

-- Partners indexes
CREATE INDEX IF NOT EXISTS "partners_parish_id_idx" ON "partners" ("parish_id");
CREATE INDEX IF NOT EXISTS "partners_type_idx" ON "partners" ("type");
CREATE INDEX IF NOT EXISTS "partners_is_active_idx" ON "partners" ("parish_id", "is_active");
--> statement-breakpoint

-- Parishioners indexes
CREATE INDEX IF NOT EXISTS "parishioners_parish_id_idx" ON "parishioners" ("parish_id");
CREATE INDEX IF NOT EXISTS "parishioners_partner_id_idx" ON "parishioners" ("partner_id");
--> statement-breakpoint

-- Cemeteries indexes
CREATE INDEX IF NOT EXISTS "cemeteries_parish_id_idx" ON "cemeteries" ("parish_id");
CREATE INDEX IF NOT EXISTS "cemeteries_is_active_idx" ON "cemeteries" ("parish_id", "is_active");
--> statement-breakpoint

-- Cemetery parcels indexes
CREATE INDEX IF NOT EXISTS "cemetery_parcels_cemetery_id_idx" ON "cemetery_parcels" ("cemetery_id");
CREATE INDEX IF NOT EXISTS "cemetery_parcels_parish_id_idx" ON "cemetery_parcels" ("parish_id");
--> statement-breakpoint

-- Cemetery rows indexes
CREATE INDEX IF NOT EXISTS "cemetery_rows_parcel_id_idx" ON "cemetery_rows" ("parcel_id");
CREATE INDEX IF NOT EXISTS "cemetery_rows_cemetery_id_idx" ON "cemetery_rows" ("cemetery_id");
CREATE INDEX IF NOT EXISTS "cemetery_rows_parish_id_idx" ON "cemetery_rows" ("parish_id");
--> statement-breakpoint

-- Cemetery graves indexes
CREATE INDEX IF NOT EXISTS "cemetery_graves_row_id_idx" ON "cemetery_graves" ("row_id");
CREATE INDEX IF NOT EXISTS "cemetery_graves_cemetery_id_idx" ON "cemetery_graves" ("cemetery_id");
CREATE INDEX IF NOT EXISTS "cemetery_graves_parish_id_idx" ON "cemetery_graves" ("parish_id");
CREATE INDEX IF NOT EXISTS "cemetery_graves_status_idx" ON "cemetery_graves" ("parish_id", "status");
--> statement-breakpoint

-- Concessions indexes
CREATE INDEX IF NOT EXISTS "concessions_grave_id_idx" ON "concessions" ("grave_id");
CREATE INDEX IF NOT EXISTS "concessions_cemetery_id_idx" ON "concessions" ("cemetery_id");
CREATE INDEX IF NOT EXISTS "concessions_parish_id_idx" ON "concessions" ("parish_id");
CREATE INDEX IF NOT EXISTS "concessions_holder_partner_id_idx" ON "concessions" ("holder_partner_id");
CREATE INDEX IF NOT EXISTS "concessions_status_idx" ON "concessions" ("parish_id", "status");
CREATE INDEX IF NOT EXISTS "concessions_expiry_date_idx" ON "concessions" ("parish_id", "expiry_date");
--> statement-breakpoint

-- Concession payments indexes
CREATE INDEX IF NOT EXISTS "concession_payments_concession_id_idx" ON "concession_payments" ("concession_id");
CREATE INDEX IF NOT EXISTS "concession_payments_parish_id_idx" ON "concession_payments" ("parish_id");
CREATE INDEX IF NOT EXISTS "concession_payments_payment_date_idx" ON "concession_payments" ("parish_id", "payment_date");
--> statement-breakpoint

-- Burials indexes
CREATE INDEX IF NOT EXISTS "burials_grave_id_idx" ON "burials" ("grave_id");
CREATE INDEX IF NOT EXISTS "burials_cemetery_id_idx" ON "burials" ("cemetery_id");
CREATE INDEX IF NOT EXISTS "burials_parish_id_idx" ON "burials" ("parish_id");
CREATE INDEX IF NOT EXISTS "burials_burial_date_idx" ON "burials" ("parish_id", "burial_date");
--> statement-breakpoint

-- Library authors indexes
CREATE INDEX IF NOT EXISTS "library_authors_parish_id_idx" ON "library_authors" ("parish_id");
CREATE INDEX IF NOT EXISTS "library_authors_name_idx" ON "library_authors" ("name");
--> statement-breakpoint

-- Library publishers indexes
CREATE INDEX IF NOT EXISTS "library_publishers_parish_id_idx" ON "library_publishers" ("parish_id");
CREATE INDEX IF NOT EXISTS "library_publishers_name_idx" ON "library_publishers" ("name");
--> statement-breakpoint

-- Library domains indexes
CREATE INDEX IF NOT EXISTS "library_domains_parish_id_idx" ON "library_domains" ("parish_id");
CREATE INDEX IF NOT EXISTS "library_domains_parent_id_idx" ON "library_domains" ("parent_id");
--> statement-breakpoint

-- Library books indexes
CREATE INDEX IF NOT EXISTS "library_books_parish_id_idx" ON "library_books" ("parish_id");
CREATE INDEX IF NOT EXISTS "library_books_author_id_idx" ON "library_books" ("author_id");
CREATE INDEX IF NOT EXISTS "library_books_publisher_id_idx" ON "library_books" ("publisher_id");
CREATE INDEX IF NOT EXISTS "library_books_domain_id_idx" ON "library_books" ("domain_id");
CREATE INDEX IF NOT EXISTS "library_books_status_idx" ON "library_books" ("parish_id", "status");
CREATE INDEX IF NOT EXISTS "library_books_isbn_idx" ON "library_books" ("isbn");
--> statement-breakpoint

-- Library loans indexes
CREATE INDEX IF NOT EXISTS "library_loans_parish_id_idx" ON "library_loans" ("parish_id");
CREATE INDEX IF NOT EXISTS "library_loans_book_id_idx" ON "library_loans" ("book_id");
CREATE INDEX IF NOT EXISTS "library_loans_borrower_partner_id_idx" ON "library_loans" ("borrower_partner_id");
CREATE INDEX IF NOT EXISTS "library_loans_status_idx" ON "library_loans" ("parish_id", "status");
CREATE INDEX IF NOT EXISTS "library_loans_due_date_idx" ON "library_loans" ("parish_id", "due_date");
--> statement-breakpoint

-- Church events indexes
CREATE INDEX IF NOT EXISTS "church_events_parish_id_idx" ON "church_events" ("parish_id");
CREATE INDEX IF NOT EXISTS "church_events_type_idx" ON "church_events" ("parish_id", "type");
CREATE INDEX IF NOT EXISTS "church_events_status_idx" ON "church_events" ("parish_id", "status");
CREATE INDEX IF NOT EXISTS "church_events_event_date_idx" ON "church_events" ("parish_id", "event_date");
--> statement-breakpoint

-- Church event participants indexes
CREATE INDEX IF NOT EXISTS "church_event_participants_event_id_idx" ON "church_event_participants" ("event_id");
CREATE INDEX IF NOT EXISTS "church_event_participants_parishioner_id_idx" ON "church_event_participants" ("parishioner_id");
--> statement-breakpoint

-- Church event documents indexes
CREATE INDEX IF NOT EXISTS "church_event_documents_event_id_idx" ON "church_event_documents" ("event_id");
--> statement-breakpoint

-- Church event email submissions indexes
CREATE INDEX IF NOT EXISTS "church_event_email_submissions_event_id_idx" ON "church_event_email_submissions" ("event_id");
CREATE INDEX IF NOT EXISTS "church_event_email_submissions_status_idx" ON "church_event_email_submissions" ("status");
--> statement-breakpoint

