-- Migration: Add HR module
-- This migration creates all tables and enums for the Human Resources management module

-- Create gender enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create employment_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."employment_status" AS ENUM('active', 'on_leave', 'terminated', 'retired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create employment_contract_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."employment_contract_type" AS ENUM('indeterminate', 'determinate', 'part_time', 'internship', 'consultant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create employment_contract_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."employment_contract_status" AS ENUM('draft', 'active', 'expired', 'terminated', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create salary_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."salary_status" AS ENUM('draft', 'calculated', 'approved', 'paid', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create salary_component_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."salary_component_type" AS ENUM('base', 'bonus', 'overtime', 'allowance', 'tax', 'social_contribution', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create time_entry_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."time_entry_status" AS ENUM('present', 'absent', 'late', 'half_day', 'holiday', 'sick_leave', 'vacation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create leave_request_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."leave_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create evaluation_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."evaluation_status" AS ENUM('draft', 'completed', 'acknowledged');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create employee_training_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."employee_training_status" AS ENUM('enrolled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create employee_document_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."employee_document_type" AS ENUM('contract', 'id_card', 'diploma', 'certificate', 'medical', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create positions table
CREATE TABLE IF NOT EXISTS "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"department_id" uuid,
	"code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"min_salary" numeric(15, 2),
	"max_salary" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positions_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Add new columns to employees table if they don't exist (table already exists from previous migration)
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id') THEN
		ALTER TABLE "employees" ADD COLUMN "user_id" uuid;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_number') THEN
		ALTER TABLE "employees" ADD COLUMN "employee_number" varchar(50);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'first_name') THEN
		ALTER TABLE "employees" ADD COLUMN "first_name" varchar(100);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_name') THEN
		ALTER TABLE "employees" ADD COLUMN "last_name" varchar(100);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'cnp') THEN
		ALTER TABLE "employees" ADD COLUMN "cnp" varchar(13);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'birth_date') THEN
		ALTER TABLE "employees" ADD COLUMN "birth_date" date;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gender') THEN
		ALTER TABLE "employees" ADD COLUMN "gender" "gender";
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
		ALTER TABLE "employees" ADD COLUMN "phone" varchar(50);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
		ALTER TABLE "employees" ADD COLUMN "email" varchar(255);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'address') THEN
		ALTER TABLE "employees" ADD COLUMN "address" text;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'city') THEN
		ALTER TABLE "employees" ADD COLUMN "city" varchar(100);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'county') THEN
		ALTER TABLE "employees" ADD COLUMN "county" varchar(100);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'postal_code') THEN
		ALTER TABLE "employees" ADD COLUMN "postal_code" varchar(20);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department_id') THEN
		ALTER TABLE "employees" ADD COLUMN "department_id" uuid;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position_id') THEN
		ALTER TABLE "employees" ADD COLUMN "position_id" uuid;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employment_status') THEN
		ALTER TABLE "employees" ADD COLUMN "employment_status" "employment_status" DEFAULT 'active';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'termination_reason') THEN
		ALTER TABLE "employees" ADD COLUMN "termination_reason" text;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'bank_name') THEN
		ALTER TABLE "employees" ADD COLUMN "bank_name" varchar(255);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'iban') THEN
		ALTER TABLE "employees" ADD COLUMN "iban" varchar(34);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'notes') THEN
		ALTER TABLE "employees" ADD COLUMN "notes" text;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_by') THEN
		ALTER TABLE "employees" ADD COLUMN "created_by" uuid;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updated_by') THEN
		ALTER TABLE "employees" ADD COLUMN "updated_by" uuid;
	END IF;
END $$;
--> statement-breakpoint

-- Add unique constraints if they don't exist
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_parish_id_employee_number_unique') THEN
		ALTER TABLE "employees" ADD CONSTRAINT "employees_parish_id_employee_number_unique" UNIQUE("parish_id","employee_number");
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_cnp_unique') THEN
		ALTER TABLE "employees" ADD CONSTRAINT "employees_cnp_unique" UNIQUE("cnp");
	END IF;
END $$;
--> statement-breakpoint

-- Create employment_contracts table
CREATE TABLE IF NOT EXISTS "employment_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_type" "employment_contract_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"probation_end_date" date,
	"base_salary" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RON' NOT NULL,
	"working_hours_per_week" integer NOT NULL,
	"work_location" varchar(255),
	"job_description" text,
	"status" "employment_contract_status" DEFAULT 'draft' NOT NULL,
	"termination_date" date,
	"termination_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "employment_contracts_employee_id_contract_number_unique" UNIQUE("employee_id","contract_number")
);
--> statement-breakpoint

-- Create salaries table
CREATE TABLE IF NOT EXISTS "salaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"salary_period" date NOT NULL,
	"base_salary" numeric(15, 2) NOT NULL,
	"gross_salary" numeric(15, 2) NOT NULL,
	"net_salary" numeric(15, 2) NOT NULL,
	"total_benefits" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"working_days" integer NOT NULL,
	"worked_days" integer NOT NULL,
	"status" "salary_status" DEFAULT 'draft' NOT NULL,
	"paid_date" date,
	"payment_reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "salaries_employee_id_salary_period_unique" UNIQUE("employee_id","salary_period")
);
--> statement-breakpoint

-- Create salary_components table
CREATE TABLE IF NOT EXISTS "salary_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salary_id" uuid NOT NULL,
	"component_type" "salary_component_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"is_percentage" boolean DEFAULT false NOT NULL,
	"percentage_value" numeric(5, 2),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create time_entries table
CREATE TABLE IF NOT EXISTS "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"check_in_time" timestamp with time zone,
	"check_out_time" timestamp with time zone,
	"break_duration_minutes" integer DEFAULT 0 NOT NULL,
	"worked_hours" numeric(5, 2),
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" "time_entry_status" DEFAULT 'present' NOT NULL,
	"notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create leave_types table
CREATE TABLE IF NOT EXISTS "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"max_days_per_year" integer,
	"is_paid" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_types_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text,
	"status" "leave_request_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create evaluation_criteria table
CREATE TABLE IF NOT EXISTS "evaluation_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"max_score" integer DEFAULT 100 NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluation_criteria_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Create evaluations table
CREATE TABLE IF NOT EXISTS "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"evaluator_id" uuid NOT NULL,
	"evaluation_period_start" date NOT NULL,
	"evaluation_period_end" date NOT NULL,
	"evaluation_date" date NOT NULL,
	"overall_score" numeric(5, 2),
	"overall_comment" text,
	"strengths" text,
	"improvement_areas" text,
	"status" "evaluation_status" DEFAULT 'draft' NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create evaluation_criteria_scores table
CREATE TABLE IF NOT EXISTS "evaluation_criteria_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create training_courses table
CREATE TABLE IF NOT EXISTS "training_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"provider" varchar(255),
	"duration_hours" integer,
	"cost" numeric(15, 2),
	"is_certified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_courses_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Create employee_training table
CREATE TABLE IF NOT EXISTS "employee_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrollment_date" date NOT NULL,
	"completion_date" date,
	"status" "employee_training_status" DEFAULT 'enrolled' NOT NULL,
	"score" numeric(5, 2),
	"certificate_number" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_id" uuid,
	"document_type" "employee_document_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"issue_date" date,
	"expiry_date" date,
	"is_confidential" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for positions
DO $$ BEGIN
 ALTER TABLE "positions" ADD CONSTRAINT "positions_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for employees
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for employment_contracts
DO $$ BEGIN
 ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for salaries
DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_contract_id_employment_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."employment_contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for salary_components
DO $$ BEGIN
 ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_salary_id_salaries_id_fk" FOREIGN KEY ("salary_id") REFERENCES "public"."salaries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for time_entries
DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for leave_types
DO $$ BEGIN
 ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for leave_requests
DO $$ BEGIN
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for evaluation_criteria
DO $$ BEGIN
 ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for evaluations
DO $$ BEGIN
 ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for evaluation_criteria_scores
DO $$ BEGIN
 ALTER TABLE "evaluation_criteria_scores" ADD CONSTRAINT "evaluation_criteria_scores_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "evaluation_criteria_scores" ADD CONSTRAINT "evaluation_criteria_scores_criterion_id_evaluation_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for training_courses
DO $$ BEGIN
 ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for employee_training
DO $$ BEGIN
 ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for employee_documents
DO $$ BEGIN
 ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_contract_id_employment_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."employment_contracts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

