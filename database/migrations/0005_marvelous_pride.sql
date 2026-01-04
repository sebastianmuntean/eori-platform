CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."transaction_method" AS ENUM('cash', 'bank', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('receipt', 'payment', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."invoice_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'sent', 'paid', 'partial', 'cancelled', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'inactive', 'disposed', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('episcop', 'vicar', 'paroh', 'secretar', 'contabil');--> statement-breakpoint
CREATE TYPE "public"."concession_status" AS ENUM('active', 'expired', 'renewed', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."grave_status" AS ENUM('free', 'occupied', 'reserved', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('person', 'company', 'supplier', 'donor', 'employee', 'parishioner', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."document_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'registered', 'distributed', 'processing', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('annual', 'sick', 'unpaid', 'maternity', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('pangar', 'material', 'service', 'fixed', 'other');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'sale', 'return');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('available', 'borrowed', 'reserved', 'damaged', 'lost');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'returned', 'overdue', 'lost');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('concession_expiry', 'insurance_expiry', 'itp_expiry', 'book_overdue', 'document_pending', 'invoice_overdue', 'low_stock', 'leave_request', 'system');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "account_type" NOT NULL,
	"parent_code" varchar(20),
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"method" "transaction_method" NOT NULL,
	"transaction_date" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"account_id" uuid NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"partner_id" uuid,
	"document_type" varchar(50),
	"document_series" varchar(20),
	"document_number" varchar(50),
	"document_date" date,
	"description" text,
	"source_type" varchar(50),
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"direction" "invoice_direction" NOT NULL,
	"series" varchar(20) NOT NULL,
	"number" integer NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"partner_id" uuid NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"vat_amount" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON',
	"paid_amount" numeric(15, 2) DEFAULT '0',
	"remaining_amount" numeric(15, 2),
	"status" "invoice_status" DEFAULT 'draft',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "invoices_parish_series_number_unique" UNIQUE("parish_id","series","number","direction")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) DEFAULT 'buc',
	"unit_price" numeric(15, 2) NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '19',
	"vat_amount" numeric(15, 2),
	"subtotal" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"account_id" uuid,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"series" varchar(20) NOT NULL,
	"start_number" integer NOT NULL,
	"end_number" integer NOT NULL,
	"current_number" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_series_parish_series_unique" UNIQUE("parish_id","series")
);
--> statement-breakpoint
CREATE TABLE "articole" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod_domeniu" varchar(255),
	"cod_produs" varchar(255),
	"cantitate" numeric(10, 2),
	"pret_intrare" numeric(10, 2),
	"valoare_intrare" numeric(10, 2),
	"pret_iesire" numeric(10, 2),
	"valoare_iesire" numeric(10, 2),
	"tva_intrare" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"inventory_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"type" varchar(100),
	"location" varchar(255),
	"acquisition_date" date,
	"acquisition_value" numeric(15, 2),
	"current_value" numeric(15, 2),
	"depreciation_method" varchar(20),
	"useful_life_years" integer,
	"status" "asset_status" DEFAULT 'active',
	"disposal_date" date,
	"disposal_value" numeric(15, 2),
	"disposal_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fixed_assets_parish_inventory_unique" UNIQUE("parish_id","inventory_number")
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"description" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_parishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"access_level" varchar(20) DEFAULT 'full',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_parishes_unique" UNIQUE("user_id","parish_id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_asigurari" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nr_inmatriculare" varchar(50),
	"tip_asigurare" varchar(255),
	"datai" date,
	"dataf" date,
	"valoare" numeric(10, 2),
	"societate" varchar(255),
	"tip_doc_plata" varchar(255),
	"nr_doc_plata" varchar(50),
	"data_doc_plata" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_categorii" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_itp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nr_inmatriculare" varchar(50),
	"datai" date,
	"dataf" date,
	"valoare" numeric(10, 2),
	"societate" varchar(255),
	"tip_doc_plata" varchar(255),
	"nr_doc_plata" varchar(50),
	"data_doc_plata" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_marci" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_modele" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_marca" integer,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_reparatii" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nr_inmatriculare" varchar(50),
	"datai" date,
	"tip_reparatie" varchar(255),
	"kilometraj" varchar(255),
	"durata" varchar(255),
	"descriere" text,
	"valoare_manopera" numeric(10, 2),
	"valoare_piese" numeric(10, 2),
	"societate" varchar(255),
	"calificativ" varchar(255),
	"tip_doc_plata" varchar(255),
	"nr_doc_plata" varchar(50),
	"data_doc_plata" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_tip_caroserii" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_tip_reparatii" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_vehicule" (
	"nr_inmatriculare" varchar(50) PRIMARY KEY NOT NULL,
	"marca" varchar(255),
	"model" varchar(255),
	"an_fabricatie" varchar(255),
	"an_achizitie" varchar(255),
	"categorie" varchar(255),
	"tip_caroserie" varchar(255),
	"serie_sasiu" varchar(255),
	"serie_motor" varchar(255),
	"putere_kw" varchar(255),
	"cc" varchar(255),
	"consum_mediu" varchar(255),
	"consum_urban" varchar(255),
	"consum_extraurban" varchar(255),
	"culoare" varchar(255),
	"descriere" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_abonamente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"nr_abonament" varchar(50),
	"data_abonament" date,
	"valoare_lunara" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_autori" (
	"coda" varchar(255) PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_carti" (
	"codc" varchar(255) PRIMARY KEY NOT NULL,
	"cods" varchar(255),
	"codr" varchar(255),
	"pozitie" varchar(255),
	"editura" varchar(255),
	"domeniu" varchar(255),
	"autor" varchar(255),
	"titlu" varchar(255) NOT NULL,
	"isbn" varchar(255),
	"descriere" text,
	"anul_aparitiei" varchar(255),
	"nr_exemplare" varchar(50),
	"imprumutabila" varchar(255),
	"stare" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_domenii" (
	"codd" varchar(255) PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_edituri" (
	"code" varchar(255) PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_imprumuturi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codc" varchar(255),
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"data_imprumut" date,
	"data_estimata_returnare" date,
	"data_returnare" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_incasare_abonamente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"data" date,
	"valoare" numeric(10, 2),
	"data_valabilitate" date,
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_rafturi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cods" varchar(255),
	"codr" varchar(255) NOT NULL,
	"denumire" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_sali" (
	"cods" varchar(255) PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblioteca_stari" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "burials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grave_id" uuid NOT NULL,
	"concession_id" uuid,
	"parish_id" uuid NOT NULL,
	"deceased_name" varchar(255) NOT NULL,
	"deceased_birth_date" date,
	"deceased_death_date" date,
	"burial_date" date NOT NULL,
	"death_certificate_number" varchar(50),
	"death_certificate_date" date,
	"death_certificate_issuer" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cemeteries" (
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
CREATE TABLE "concession_payments" (
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
CREATE TABLE "concessions" (
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
CREATE TABLE "cemetery_graves" (
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
CREATE TABLE "cemetery_parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemetery_parcels_cemetery_code_unique" UNIQUE("cemetery_id","code")
);
--> statement-breakpoint
CREATE TABLE "cemetery_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"cemetery_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cemetery_rows_parcel_code_unique" UNIQUE("parcel_id","code")
);
--> statement-breakpoint
CREATE TABLE "cimitir_concesiuni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cimitir_id" uuid,
	"codp" varchar(255),
	"codr" varchar(255),
	"codl" varchar(255),
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"nr_contract" varchar(50),
	"data_contract" date,
	"data_expirare" date,
	"valoare_anuala" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitir_incasare_concesiuni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cimitir_id" uuid,
	"codp" varchar(255),
	"codr" varchar(255),
	"codl" varchar(255),
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"data_plata" date,
	"data_expirare" date,
	"valoare" numeric(10, 2),
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitir_locuri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cimitir_id" uuid,
	"codp" varchar(255),
	"codr" varchar(255),
	"codl" varchar(255) NOT NULL,
	"detalii" text,
	"stare" varchar(255),
	"nr_decedati" varchar(50),
	"decedati" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitir_parcele" (
	"codp" varchar(255) PRIMARY KEY NOT NULL,
	"cimitir_id" uuid,
	"denumire" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitir_randuri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cimitir_id" uuid,
	"codp" varchar(255),
	"codr" varchar(255) NOT NULL,
	"denumire" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitir_vanzare_locuri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cimitir_id" uuid,
	"codp" varchar(255),
	"codr" varchar(255),
	"codl" varchar(255),
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"nr_contract" varchar(50),
	"data_contract" date,
	"valoare" numeric(10, 2),
	"data_plata" date,
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cimitire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod" varchar(50) NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"adresa" text,
	"localitate" varchar(255),
	"judet" varchar(255),
	"suprafata_totala" numeric(10, 2),
	"nr_parcele" numeric(10, 0),
	"observatii" text,
	"activ" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cimitire_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "contracte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nr" varchar(255) NOT NULL,
	"data" date,
	"nr_partener" varchar(50),
	"data_partener" date,
	"cod_partener" varchar(255),
	"valoare" numeric(10, 2),
	"obiect" text,
	"parohie_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracte_documente" (
	"id_doc" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nr" varchar(255),
	"data" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deaneries" (
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
CREATE TABLE "dioceses" (
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
CREATE TABLE "parishes" (
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
CREATE TABLE "partners" (
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
CREATE TABLE "documente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod_domeniu" varchar(255),
	"tip_inregistrare" varchar(255),
	"destinatie" varchar(255),
	"nr_nir" varchar(50),
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"data_doc" date,
	"cod_partener" varchar(255),
	"valoare_intrare" numeric(10, 2),
	"valoare_iesire" numeric(10, 2),
	"tva_intrare" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"description" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"direction" "document_direction" NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_number_counters_unique" UNIQUE("parish_id","year","direction")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"direction" "document_direction" NOT NULL,
	"registration_number" integer NOT NULL,
	"registration_year" integer NOT NULL,
	"registration_date" date NOT NULL,
	"formatted_number" varchar(50) NOT NULL,
	"sender_partner_id" uuid,
	"sender_name" varchar(255),
	"sender_doc_number" varchar(100),
	"sender_doc_date" date,
	"recipient_partner_id" uuid,
	"recipient_name" varchar(255),
	"subject" varchar(500) NOT NULL,
	"content" text,
	"status" "document_status" DEFAULT 'draft',
	"priority" "document_priority" DEFAULT 'normal',
	"department" varchar(100),
	"file_index" varchar(50),
	"parent_document_id" uuid,
	"due_date" date,
	"completed_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_parish_year_direction_number_unique" UNIQUE("parish_id","registration_year","direction","registration_number")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"license_plate" varchar(20) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"category" varchar(50),
	"body_type" varchar(50),
	"manufacture_year" integer,
	"acquisition_year" integer,
	"vin" varchar(50),
	"engine_number" varchar(50),
	"engine_capacity" integer,
	"power_kw" integer,
	"fuel_type" varchar(20),
	"color" varchar(50),
	"current_mileage" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_parish_plate_unique" UNIQUE("parish_id","license_plate")
);
--> statement-breakpoint
CREATE TABLE "vehicle_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"insurance_type" varchar(50) NOT NULL,
	"company" varchar(255),
	"policy_number" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"amount" numeric(10, 2),
	"document_number" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"inspection_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"result" varchar(50),
	"company" varchar(255),
	"amount" numeric(10, 2),
	"document_number" varchar(100),
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_repairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"repair_date" date NOT NULL,
	"repair_type" varchar(100),
	"mileage" integer,
	"duration_hours" numeric(5, 2),
	"description" text,
	"labor_cost" numeric(10, 2),
	"parts_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"company" varchar(255),
	"rating" varchar(50),
	"document_type" varchar(50),
	"document_number" varchar(100),
	"document_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "gestiuni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod" varchar(50) NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"descriere" text,
	"parohie_id" uuid,
	"responsabil" varchar(255),
	"telefon" varchar(50),
	"email" varchar(255),
	"adresa" text,
	"activ" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gestiuni_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "help" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod1" varchar(255),
	"cod2" varchar(255),
	"cod3" varchar(255),
	"denumire" varchar(255),
	"html" text
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"employee_code" varchar(50) NOT NULL,
	"position" varchar(255),
	"department" varchar(100),
	"hire_date" date NOT NULL,
	"termination_date" date,
	"contract_type" varchar(50),
	"salary" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_parish_code_unique" UNIQUE("parish_id","employee_code")
);
--> statement-breakpoint
CREATE TABLE "leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "leave_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"reason" text,
	"status" "leave_status" DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"hours_worked" numeric(4, 2),
	"is_present" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timesheets_employee_date_unique" UNIQUE("employee_id","date")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'general',
	"address" text,
	"responsible_name" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"stock_method" varchar(10) DEFAULT 'FIFO',
	"allow_negative_stock" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category" DEFAULT 'other',
	"unit" varchar(20) DEFAULT 'buc' NOT NULL,
	"purchase_price" numeric(15, 2),
	"sale_price" numeric(15, 2),
	"vat_rate" numeric(5, 2) DEFAULT '19',
	"expense_account_id" uuid,
	"income_account_id" uuid,
	"stock_account_id" uuid,
	"min_stock" numeric(10, 3),
	"barcode" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_parish_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint
CREATE TABLE "stock_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"lot_number" varchar(50),
	"expiry_date" date,
	"initial_quantity" numeric(10, 3) NOT NULL,
	"current_quantity" numeric(10, 3) NOT NULL,
	"unit_cost" numeric(15, 4) NOT NULL,
	"movement_id" uuid,
	"received_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "movement_type" NOT NULL,
	"movement_date" date NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_cost" numeric(15, 4),
	"total_value" numeric(15, 2),
	"document_type" varchar(50),
	"document_number" varchar(50),
	"document_date" date,
	"partner_id" uuid,
	"destination_warehouse_id" uuid,
	"related_movement_id" uuid,
	"lot_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"sale_date" date NOT NULL,
	"sale_number" varchar(50),
	"partner_id" uuid,
	"subtotal" numeric(15, 2) NOT NULL,
	"vat_amount" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) NOT NULL,
	"payment_method" "transaction_method" DEFAULT 'cash',
	"is_paid" boolean DEFAULT true,
	"transaction_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"vat_rate" numeric(5, 2),
	"subtotal" numeric(15, 2) NOT NULL,
	"vat_amount" numeric(15, 2),
	"total" numeric(15, 2) NOT NULL,
	"movement_id" uuid
);
--> statement-breakpoint
CREATE TABLE "library_authors" (
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
CREATE TABLE "library_publishers" (
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
CREATE TABLE "library_domains" (
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
CREATE TABLE "library_books" (
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
CREATE TABLE "library_loans" (
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
CREATE TABLE "parish_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"document_number_format" varchar(100) DEFAULT '{number}/{date}',
	"document_date_format" varchar(20) DEFAULT 'DD.MM.YYYY',
	"receipt_series_prefix" varchar(10),
	"invoice_series_prefix" varchar(10),
	"concession_expiry_warning_days" integer DEFAULT 30,
	"insurance_expiry_warning_days" integer DEFAULT 30,
	"book_due_warning_days" integer DEFAULT 3,
	"low_stock_warning_threshold" numeric(10, 2) DEFAULT '5',
	"default_income_account_id" uuid,
	"default_expense_account_id" uuid,
	"default_vat_rate" numeric(5, 2) DEFAULT '19',
	"currency" varchar(3) DEFAULT 'RON',
	"timezone" varchar(50) DEFAULT 'Europe/Bucharest',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "parish_settings_parish_id_unique" UNIQUE("parish_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "const_domenii" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "const_judete" (
	"idj" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "const_localitati" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idj" integer,
	"idl" integer,
	"idu" integer,
	"denumire" varchar(255) NOT NULL,
	"tip" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "const_localitati_tipuri" (
	"id" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "const_serii_bp" (
	"serie" varchar(255) PRIMARY KEY NOT NULL,
	"nri" varchar(255),
	"nrf" varchar(255),
	"nrc" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "const_serii_ch" (
	"serie" varchar(255) PRIMARY KEY NOT NULL,
	"nri" varchar(255),
	"nrf" varchar(255),
	"nrc" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "const_xml_data" (
	"denumire" varchar(255) PRIMARY KEY NOT NULL,
	"xmldata" text
);
--> statement-breakpoint
CREATE TABLE "enoriasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"cod" serial NOT NULL,
	"nume" varchar(255) NOT NULL,
	"prenume" varchar(255),
	"data_nasterii" timestamp with time zone,
	"profesie" varchar(255),
	"ocupatie" varchar(255),
	"stare_civila" varchar(255),
	"telefon" varchar(255),
	"email" varchar(255),
	"observatii" text,
	"clasificare" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enoriasi_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "enoriasi_clasificare" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parteneri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip" varchar(255),
	"cod" serial NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"cif" varchar(255),
	"rc" varchar(255),
	"banca" varchar(255),
	"iban" varchar(255),
	"idj" integer,
	"idl" integer,
	"adresa" text,
	"nume" varchar(255),
	"prenume" varchar(255),
	"telefon" varchar(255),
	"email" varchar(255),
	"observatii" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parteneri_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "planct" (
	"simbol" varchar(255) PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"tip" varchar(255),
	"grup" varchar(255),
	"procent" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planct_definitii" (
	"cod" serial PRIMARY KEY NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"simbol" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "produse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod_domeniu" varchar(255),
	"cod_produs" varchar(255) NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"um" varchar(255),
	"pret_achizitie" numeric(10, 2),
	"pret_vanzare" numeric(10, 2),
	"cont_cheltuieli" varchar(255),
	"cont_venituri" varchar(255),
	"cota_tva" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbotezuri" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parohie_id" uuid,
	"nr_cb" varchar(50),
	"data_cb" date,
	"nr_cn" varchar(50),
	"data_cn" date,
	"cnp" varchar(255),
	"eliberat_de_cn" varchar(255),
	"data_nasterii" date,
	"data_botezului" date,
	"nume_botezat" varchar(255) NOT NULL,
	"legitim" varchar(255),
	"parinti" varchar(255),
	"profesia_parinti" varchar(255),
	"adresa_parinti" text,
	"nasi" varchar(255),
	"adresa_nasi" text,
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"data_doc" date,
	"valoare" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rchitantiere" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parohie_id" uuid,
	"nr_crt" varchar(50),
	"data_intrarii" date,
	"serie" varchar(255),
	"nri" varchar(255),
	"nrf" varchar(255),
	"datai" date,
	"dataf" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rcununii" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parohie_id" uuid,
	"nr_ccununie" varchar(50),
	"data_ccununie" date,
	"nr_ccasatorie" varchar(50),
	"data_ccasatorie" date,
	"eliberat_de_ccasatorie" varchar(255),
	"nume_mire" varchar(255) NOT NULL,
	"stare_civila_mire" varchar(255),
	"varsta_mire" varchar(255),
	"nume_mireasa" varchar(255) NOT NULL,
	"stare_civila_mireasa" varchar(255),
	"varsta_mireasa" varchar(255),
	"adresa_miri" text,
	"nasi" varchar(255),
	"adresa_nasi" text,
	"observatii" text,
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"data_doc" date,
	"valoare" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rinmormantari" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parohie_id" uuid,
	"nr_cd" varchar(50),
	"data_cd" date,
	"eliberat_de_cd" varchar(255),
	"decedat" varchar(255) NOT NULL,
	"sex" varchar(255),
	"varsta" varchar(255),
	"profesia" varchar(255),
	"cauza_mortii" varchar(255),
	"data_inmormantarii" date,
	"data_mortii" date,
	"locul_inmormantarii" varchar(255),
	"tip_doc" varchar(255),
	"nr_doc" varchar(50),
	"data_doc" date,
	"valoare" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rinout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parohie_id" uuid,
	"tip" varchar(255),
	"nr_inregistrare" varchar(50),
	"data" date,
	"partener" varchar(255),
	"nr_inregistrare_partener" varchar(50),
	"continut" text,
	"observatii" text,
	"anul" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parohii" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod" varchar(50) NOT NULL,
	"denumire" varchar(255) NOT NULL,
	"adresa" text,
	"localitate" varchar(255),
	"judet" varchar(255),
	"telefon" varchar(50),
	"email" varchar(255),
	"preot_paroh" varchar(255),
	"preot_vicar" varchar(255),
	"nr_enoriasi" integer,
	"observatii" text,
	"activ" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parohii_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "previziuni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anul" varchar(255) NOT NULL,
	"cont" varchar(255),
	"total" varchar(255),
	"trim1" varchar(255),
	"trim2" varchar(255),
	"trim3" varchar(255),
	"trim4" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_resource_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255) NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cod_domeniu" varchar(255),
	"data" date NOT NULL,
	"tip_doc" varchar(255),
	"serie_doc" varchar(255),
	"nr_doc" varchar(50),
	"serie_bon_plata" varchar(255),
	"nr_bon_plata" varchar(50),
	"explicatii" text,
	"val_incasare" varchar(255),
	"val_plata" varchar(255),
	"cont" varchar(255),
	"tip_partener" varchar(255),
	"cod_partener" varchar(255),
	"id_doc" uuid,
	"data_valabilitatii" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "email_templates" CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_permission_id_unique";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_role_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "approval_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "reset_token" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verification_code" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "token" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "ip_address" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "resource" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'paroh';
UPDATE "users" SET "role" = 'paroh' WHERE "role" IS NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "parohie_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "display_name" varchar(255);
UPDATE "roles" SET "display_name" = "name" WHERE "display_name" IS NULL;
ALTER TABLE "roles" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "display_name" varchar(255);
UPDATE "permissions" SET "display_name" = "name" WHERE "display_name" IS NULL;
ALTER TABLE "permissions" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "is_system" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_series" ADD CONSTRAINT "receipt_series_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_parishes" ADD CONSTRAINT "user_parishes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_parishes" ADD CONSTRAINT "user_parishes_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_asigurari" ADD CONSTRAINT "auto_asigurari_vehicle_fk" FOREIGN KEY ("nr_inmatriculare") REFERENCES "public"."auto_vehicule"("nr_inmatriculare") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_itp" ADD CONSTRAINT "auto_itp_vehicle_fk" FOREIGN KEY ("nr_inmatriculare") REFERENCES "public"."auto_vehicule"("nr_inmatriculare") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_modele" ADD CONSTRAINT "auto_modele_id_marca_auto_marci_cod_fk" FOREIGN KEY ("id_marca") REFERENCES "public"."auto_marci"("cod") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reparatii" ADD CONSTRAINT "auto_reparatii_vehicle_fk" FOREIGN KEY ("nr_inmatriculare") REFERENCES "public"."auto_vehicule"("nr_inmatriculare") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biblioteca_carti" ADD CONSTRAINT "biblioteca_carti_cods_biblioteca_sali_cods_fk" FOREIGN KEY ("cods") REFERENCES "public"."biblioteca_sali"("cods") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biblioteca_imprumuturi" ADD CONSTRAINT "biblioteca_imprumuturi_codc_biblioteca_carti_codc_fk" FOREIGN KEY ("codc") REFERENCES "public"."biblioteca_carti"("codc") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biblioteca_rafturi" ADD CONSTRAINT "biblioteca_rafturi_cods_biblioteca_sali_cods_fk" FOREIGN KEY ("cods") REFERENCES "public"."biblioteca_sali"("cods") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burials" ADD CONSTRAINT "burials_grave_id_cemetery_graves_id_fk" FOREIGN KEY ("grave_id") REFERENCES "public"."cemetery_graves"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burials" ADD CONSTRAINT "burials_concession_id_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."concessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burials" ADD CONSTRAINT "burials_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burials" ADD CONSTRAINT "burials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemeteries" ADD CONSTRAINT "cemeteries_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_concession_id_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."concessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concession_payments" ADD CONSTRAINT "concession_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_grave_id_cemetery_graves_id_fk" FOREIGN KEY ("grave_id") REFERENCES "public"."cemetery_graves"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "public"."cemeteries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_holder_partner_id_partners_id_fk" FOREIGN KEY ("holder_partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessions" ADD CONSTRAINT "concessions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_row_id_cemetery_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."cemetery_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_parcel_id_cemetery_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."cemetery_parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "public"."cemeteries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_graves" ADD CONSTRAINT "cemetery_graves_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_parcels" ADD CONSTRAINT "cemetery_parcels_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "public"."cemeteries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_parcels" ADD CONSTRAINT "cemetery_parcels_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_parcel_id_cemetery_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."cemetery_parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "public"."cemeteries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cemetery_rows" ADD CONSTRAINT "cemetery_rows_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_concesiuni" ADD CONSTRAINT "cimitir_concesiuni_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_incasare_concesiuni" ADD CONSTRAINT "cimitir_incasare_concesiuni_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_locuri" ADD CONSTRAINT "cimitir_locuri_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_locuri" ADD CONSTRAINT "cimitir_locuri_codp_cimitir_parcele_codp_fk" FOREIGN KEY ("codp") REFERENCES "public"."cimitir_parcele"("codp") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_parcele" ADD CONSTRAINT "cimitir_parcele_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_randuri" ADD CONSTRAINT "cimitir_randuri_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_randuri" ADD CONSTRAINT "cimitir_randuri_codp_cimitir_parcele_codp_fk" FOREIGN KEY ("codp") REFERENCES "public"."cimitir_parcele"("codp") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cimitir_vanzare_locuri" ADD CONSTRAINT "cimitir_vanzare_locuri_cimitir_id_cimitire_id_fk" FOREIGN KEY ("cimitir_id") REFERENCES "public"."cimitire"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracte" ADD CONSTRAINT "contracte_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deaneries" ADD CONSTRAINT "deaneries_diocese_id_dioceses_id_fk" FOREIGN KEY ("diocese_id") REFERENCES "public"."dioceses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parishes" ADD CONSTRAINT "parishes_deanery_id_deaneries_id_fk" FOREIGN KEY ("deanery_id") REFERENCES "public"."deaneries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parishes" ADD CONSTRAINT "parishes_diocese_id_dioceses_id_fk" FOREIGN KEY ("diocese_id") REFERENCES "public"."dioceses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_number_counters" ADD CONSTRAINT "document_number_counters_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_sender_partner_id_partners_id_fk" FOREIGN KEY ("sender_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_recipient_partner_id_partners_id_fk" FOREIGN KEY ("recipient_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_repairs" ADD CONSTRAINT "vehicle_repairs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_repairs" ADD CONSTRAINT "vehicle_repairs_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_repairs" ADD CONSTRAINT "vehicle_repairs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gestiuni" ADD CONSTRAINT "gestiuni_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_expense_account_id_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_income_account_id_accounts_id_fk" FOREIGN KEY ("income_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_account_id_accounts_id_fk" FOREIGN KEY ("stock_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lot_id_stock_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."stock_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_movement_id_stock_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."stock_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_authors" ADD CONSTRAINT "library_authors_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_publishers" ADD CONSTRAINT "library_publishers_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_domains" ADD CONSTRAINT "library_domains_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_author_id_library_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."library_authors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_publisher_id_library_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."library_publishers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_domain_id_library_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."library_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_book_id_library_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."library_books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_borrower_partner_id_partners_id_fk" FOREIGN KEY ("borrower_partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parish_settings" ADD CONSTRAINT "parish_settings_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parish_settings" ADD CONSTRAINT "parish_settings_default_income_account_id_accounts_id_fk" FOREIGN KEY ("default_income_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parish_settings" ADD CONSTRAINT "parish_settings_default_expense_account_id_accounts_id_fk" FOREIGN KEY ("default_expense_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parish_settings" ADD CONSTRAINT "parish_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "const_localitati" ADD CONSTRAINT "const_localitati_idj_const_judete_idj_fk" FOREIGN KEY ("idj") REFERENCES "public"."const_judete"("idj") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "const_localitati" ADD CONSTRAINT "const_localitati_idu_const_localitati_tipuri_id_fk" FOREIGN KEY ("idu") REFERENCES "public"."const_localitati_tipuri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbotezuri" ADD CONSTRAINT "rbotezuri_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rchitantiere" ADD CONSTRAINT "rchitantiere_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcununii" ADD CONSTRAINT "rcununii_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rinmormantari" ADD CONSTRAINT "rinmormantari_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rinout" ADD CONSTRAINT "rinout_parohie_id_parohii_id_fk" FOREIGN KEY ("parohie_id") REFERENCES "public"."parohii"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_resource_access" ADD CONSTRAINT "user_resource_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_parish" ON "accounts" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_code" ON "accounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_accounts_type" ON "accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_accounts_active" ON "accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_transactions_parish_date" ON "transactions" USING btree ("parish_id","transaction_date");--> statement-breakpoint
CREATE INDEX "idx_transactions_parish_account" ON "transactions" USING btree ("parish_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_parish_type" ON "transactions" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_transactions_source" ON "transactions" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_partner" ON "transactions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_parish_date" ON "invoices" USING btree ("parish_id","issue_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_parish_status" ON "invoices" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_invoices_parish_due" ON "invoices" USING btree ("parish_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_partner" ON "invoices" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_direction" ON "invoices" USING btree ("parish_id","direction");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_product" ON "invoice_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_payments_invoice" ON "invoice_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_payments_transaction" ON "invoice_payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_series_parish" ON "receipt_series" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_series_active" ON "receipt_series" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_fixed_assets_parish" ON "fixed_assets" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_assets_category" ON "fixed_assets" USING btree ("parish_id","category");--> statement-breakpoint
CREATE INDEX "idx_fixed_assets_status" ON "fixed_assets" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_fixed_assets_location" ON "fixed_assets" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_activity_log_parish" ON "activity_log" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_user" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_entity" ON "activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_created" ON "activity_log" USING btree ("parish_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_log_action" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_user_parishes_user" ON "user_parishes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_parishes_parish" ON "user_parishes" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_user_parishes_primary" ON "user_parishes" USING btree ("user_id","is_primary");--> statement-breakpoint
CREATE INDEX "idx_burials_grave" ON "burials" USING btree ("grave_id");--> statement-breakpoint
CREATE INDEX "idx_burials_parish" ON "burials" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_burials_parish_date" ON "burials" USING btree ("parish_id","burial_date");--> statement-breakpoint
CREATE INDEX "idx_burials_concession" ON "burials" USING btree ("concession_id");--> statement-breakpoint
CREATE INDEX "idx_cemeteries_parish" ON "cemeteries" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_cemeteries_active" ON "cemeteries" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_concession_payments_concession" ON "concession_payments" USING btree ("concession_id");--> statement-breakpoint
CREATE INDEX "idx_concession_payments_parish" ON "concession_payments" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_concession_payments_parish_date" ON "concession_payments" USING btree ("parish_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_concessions_parish_expiry" ON "concessions" USING btree ("parish_id","expiry_date");--> statement-breakpoint
CREATE INDEX "idx_concessions_parish_status" ON "concessions" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_concessions_cemetery" ON "concessions" USING btree ("cemetery_id");--> statement-breakpoint
CREATE INDEX "idx_concessions_grave" ON "concessions" USING btree ("grave_id");--> statement-breakpoint
CREATE INDEX "idx_concessions_expired" ON "concessions" USING btree ("parish_id","is_expired");--> statement-breakpoint
CREATE INDEX "idx_concessions_holder" ON "concessions" USING btree ("holder_partner_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_graves_row" ON "cemetery_graves" USING btree ("row_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_graves_cemetery" ON "cemetery_graves" USING btree ("cemetery_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_graves_parish" ON "cemetery_graves" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_graves_status" ON "cemetery_graves" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_cemetery_parcels_cemetery" ON "cemetery_parcels" USING btree ("cemetery_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_parcels_parish" ON "cemetery_parcels" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_rows_parcel" ON "cemetery_rows" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_rows_cemetery" ON "cemetery_rows" USING btree ("cemetery_id");--> statement-breakpoint
CREATE INDEX "idx_cemetery_rows_parish" ON "cemetery_rows" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_deaneries_diocese" ON "deaneries" USING btree ("diocese_id");--> statement-breakpoint
CREATE INDEX "idx_deaneries_active" ON "deaneries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_dioceses_active" ON "dioceses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_dioceses_code" ON "dioceses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_parishes_deanery" ON "parishes" USING btree ("deanery_id");--> statement-breakpoint
CREATE INDEX "idx_parishes_diocese" ON "parishes" USING btree ("diocese_id");--> statement-breakpoint
CREATE INDEX "idx_parishes_active" ON "parishes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_parishes_city" ON "parishes" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_parishes_county" ON "parishes" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_partners_parish" ON "partners" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_partners_type" ON "partners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_partners_parish_type" ON "partners" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_partners_active" ON "partners" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_partners_last_name" ON "partners" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "idx_partners_company_name" ON "partners" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_parish" ON "attachments" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_doc_counters_parish_year" ON "document_number_counters" USING btree ("parish_id","year");--> statement-breakpoint
CREATE INDEX "idx_documents_parish_date" ON "documents" USING btree ("parish_id","registration_date");--> statement-breakpoint
CREATE INDEX "idx_documents_parish_year" ON "documents" USING btree ("parish_id","registration_year");--> statement-breakpoint
CREATE INDEX "idx_documents_parish_status" ON "documents" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_documents_parish_direction" ON "documents" USING btree ("parish_id","direction");--> statement-breakpoint
CREATE INDEX "idx_documents_due_date" ON "documents" USING btree ("parish_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_documents_parent" ON "documents" USING btree ("parent_document_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_parish" ON "vehicles" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_active" ON "vehicles" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_vehicles_vin" ON "vehicles" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "idx_vehicle_insurances_vehicle" ON "vehicle_insurances" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_insurances_parish" ON "vehicle_insurances" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_insurances_end" ON "vehicle_insurances" USING btree ("parish_id","end_date");--> statement-breakpoint
CREATE INDEX "idx_vehicle_insurances_type" ON "vehicle_insurances" USING btree ("parish_id","insurance_type");--> statement-breakpoint
CREATE INDEX "idx_vehicle_inspections_vehicle" ON "vehicle_inspections" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_inspections_parish" ON "vehicle_inspections" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_inspections_expiry" ON "vehicle_inspections" USING btree ("parish_id","expiry_date");--> statement-breakpoint
CREATE INDEX "idx_vehicle_repairs_vehicle" ON "vehicle_repairs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_repairs_parish" ON "vehicle_repairs" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_repairs_date" ON "vehicle_repairs" USING btree ("parish_id","repair_date");--> statement-breakpoint
CREATE INDEX "idx_vehicle_repairs_type" ON "vehicle_repairs" USING btree ("repair_type");--> statement-breakpoint
CREATE INDEX "idx_employees_parish" ON "employees" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_employees_partner" ON "employees" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_employees_active" ON "employees" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "employees" USING btree ("parish_id","department");--> statement-breakpoint
CREATE INDEX "idx_leaves_parish" ON "leaves" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_leaves_employee" ON "leaves" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_leaves_status" ON "leaves" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_leaves_dates" ON "leaves" USING btree ("parish_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_leaves_type" ON "leaves" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_timesheets_parish" ON "timesheets" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_employee" ON "timesheets" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_date" ON "timesheets" USING btree ("parish_id","date");--> statement-breakpoint
CREATE INDEX "idx_warehouses_parish" ON "warehouses" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_warehouses_active" ON "warehouses" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_warehouses_type" ON "warehouses" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_products_parish" ON "products" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "products" USING btree ("parish_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_products_barcode" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "idx_stock_lots_wh_product" ON "stock_lots" USING btree ("warehouse_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_lots_parish" ON "stock_lots" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_stock_lots_received" ON "stock_lots" USING btree ("warehouse_id","product_id","received_date");--> statement-breakpoint
CREATE INDEX "idx_stock_lots_expiry" ON "stock_lots" USING btree ("parish_id","expiry_date");--> statement-breakpoint
CREATE INDEX "idx_stock_lots_current_qty" ON "stock_lots" USING btree ("warehouse_id","product_id","current_quantity");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_wh_product" ON "stock_movements" USING btree ("warehouse_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_parish_date" ON "stock_movements" USING btree ("parish_id","movement_date");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_type" ON "stock_movements" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_partner" ON "stock_movements" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_lot" ON "stock_movements" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "idx_sales_parish_date" ON "sales" USING btree ("parish_id","sale_date");--> statement-breakpoint
CREATE INDEX "idx_sales_warehouse" ON "sales" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_sales_partner" ON "sales" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_sale_items_sale" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_sale_items_product" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_library_authors_parish" ON "library_authors" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_library_authors_name" ON "library_authors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_library_publishers_parish" ON "library_publishers" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_library_publishers_name" ON "library_publishers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_library_domains_parish" ON "library_domains" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_library_domains_parent" ON "library_domains" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_library_books_parish" ON "library_books" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_library_books_author" ON "library_books" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_library_books_publisher" ON "library_books" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "idx_library_books_domain" ON "library_books" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "idx_library_books_status" ON "library_books" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_library_books_isbn" ON "library_books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "idx_library_books_title" ON "library_books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_library_loans_parish" ON "library_loans" USING btree ("parish_id");--> statement-breakpoint
CREATE INDEX "idx_library_loans_book" ON "library_loans" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_library_loans_borrower" ON "library_loans" USING btree ("borrower_partner_id");--> statement-breakpoint
CREATE INDEX "idx_library_loans_status" ON "library_loans" USING btree ("parish_id","status");--> statement-breakpoint
CREATE INDEX "idx_library_loans_due" ON "library_loans" USING btree ("parish_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_parish_user" ON "notifications" USING btree ("parish_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("parish_id","user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_scheduled" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("parish_id","type");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
-- ALTER TABLE "users" DROP COLUMN "address";--> statement-breakpoint
-- ALTER TABLE "users" DROP COLUMN "city";--> statement-breakpoint
-- ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "last_used_at";--> statement-breakpoint
ALTER TABLE "permissions" DROP COLUMN "updated_at";--> statement-breakpoint
DROP TYPE "public"."template_category";