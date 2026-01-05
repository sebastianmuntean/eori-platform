-- Migration: Add Catechesis module
-- This migration creates all tables and enums for the Catechesis management module

-- Create enrollment_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create progress_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create catechesis_classes table
CREATE TABLE IF NOT EXISTS "catechesis_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"grade" varchar(50),
	"teacher_id" uuid,
	"start_date" date,
	"end_date" date,
	"max_students" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create catechesis_students table
CREATE TABLE IF NOT EXISTS "catechesis_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"date_of_birth" date,
	"parent_name" varchar(255),
	"parent_email" varchar(255),
	"parent_phone" varchar(50),
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create catechesis_lessons table
CREATE TABLE IF NOT EXISTS "catechesis_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"class_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"order_index" integer DEFAULT 0,
	"duration_minutes" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create catechesis_enrollments table
CREATE TABLE IF NOT EXISTS "catechesis_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create catechesis_progress table
CREATE TABLE IF NOT EXISTS "catechesis_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"time_spent_minutes" integer,
	"score" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for catechesis_classes
DO $$ BEGIN
 ALTER TABLE "catechesis_classes" ADD CONSTRAINT "catechesis_classes_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_classes" ADD CONSTRAINT "catechesis_classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for catechesis_students
DO $$ BEGIN
 ALTER TABLE "catechesis_students" ADD CONSTRAINT "catechesis_students_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for catechesis_lessons
DO $$ BEGIN
 ALTER TABLE "catechesis_lessons" ADD CONSTRAINT "catechesis_lessons_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_lessons" ADD CONSTRAINT "catechesis_lessons_class_id_catechesis_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."catechesis_classes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_lessons" ADD CONSTRAINT "catechesis_lessons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for catechesis_enrollments
DO $$ BEGIN
 ALTER TABLE "catechesis_enrollments" ADD CONSTRAINT "catechesis_enrollments_class_id_catechesis_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."catechesis_classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_enrollments" ADD CONSTRAINT "catechesis_enrollments_student_id_catechesis_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."catechesis_students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key constraints for catechesis_progress
DO $$ BEGIN
 ALTER TABLE "catechesis_progress" ADD CONSTRAINT "catechesis_progress_enrollment_id_catechesis_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."catechesis_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_progress" ADD CONSTRAINT "catechesis_progress_lesson_id_catechesis_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."catechesis_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add unique constraints
DO $$ BEGIN
 ALTER TABLE "catechesis_enrollments" ADD CONSTRAINT "catechesis_enrollments_class_id_student_id_unique" UNIQUE("class_id","student_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "catechesis_progress" ADD CONSTRAINT "catechesis_progress_enrollment_id_lesson_id_unique" UNIQUE("enrollment_id","lesson_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "catechesis_classes_parish_id_idx" ON "catechesis_classes" ("parish_id");
CREATE INDEX IF NOT EXISTS "catechesis_classes_teacher_id_idx" ON "catechesis_classes" ("teacher_id");
CREATE INDEX IF NOT EXISTS "catechesis_classes_is_active_idx" ON "catechesis_classes" ("is_active");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "catechesis_students_parish_id_idx" ON "catechesis_students" ("parish_id");
CREATE INDEX IF NOT EXISTS "catechesis_students_is_active_idx" ON "catechesis_students" ("is_active");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "catechesis_lessons_parish_id_idx" ON "catechesis_lessons" ("parish_id");
CREATE INDEX IF NOT EXISTS "catechesis_lessons_class_id_idx" ON "catechesis_lessons" ("class_id");
CREATE INDEX IF NOT EXISTS "catechesis_lessons_created_by_idx" ON "catechesis_lessons" ("created_by");
CREATE INDEX IF NOT EXISTS "catechesis_lessons_is_published_idx" ON "catechesis_lessons" ("is_published");
CREATE INDEX IF NOT EXISTS "catechesis_lessons_order_index_idx" ON "catechesis_lessons" ("class_id","order_index");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "catechesis_enrollments_class_id_idx" ON "catechesis_enrollments" ("class_id");
CREATE INDEX IF NOT EXISTS "catechesis_enrollments_student_id_idx" ON "catechesis_enrollments" ("student_id");
CREATE INDEX IF NOT EXISTS "catechesis_enrollments_status_idx" ON "catechesis_enrollments" ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "catechesis_progress_enrollment_id_idx" ON "catechesis_progress" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "catechesis_progress_lesson_id_idx" ON "catechesis_progress" ("lesson_id");
CREATE INDEX IF NOT EXISTS "catechesis_progress_status_idx" ON "catechesis_progress" ("status");
--> statement-breakpoint

