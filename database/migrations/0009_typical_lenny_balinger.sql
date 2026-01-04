CREATE TYPE "public"."general_register_resolution_status" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."general_register_step_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."general_register_workflow_action" AS ENUM('sent', 'forwarded', 'returned', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'in_work' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'distributed' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'resolved' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE TABLE "general_register_workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_step_id" uuid,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"action" "general_register_workflow_action" NOT NULL,
	"step_status" "general_register_step_status" DEFAULT 'pending' NOT NULL,
	"resolution_status" "general_register_resolution_status",
	"resolution" text,
	"notes" text,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "general_register_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"workflow_step_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" bigint NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_signed" boolean DEFAULT false NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp with time zone,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_registry" ALTER COLUMN "registration_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_registry" ALTER COLUMN "registration_year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_registry" ALTER COLUMN "formatted_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_registry" ALTER COLUMN "registration_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_document_id_general_register_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."general_register"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_parent_step_id_general_register_workflow_id_fk" FOREIGN KEY ("parent_step_id") REFERENCES "public"."general_register_workflow"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_workflow" ADD CONSTRAINT "general_register_workflow_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_attachments" ADD CONSTRAINT "general_register_attachments_document_id_general_register_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."general_register"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_attachments" ADD CONSTRAINT "general_register_attachments_workflow_step_id_general_register_workflow_id_fk" FOREIGN KEY ("workflow_step_id") REFERENCES "public"."general_register_workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_attachments" ADD CONSTRAINT "general_register_attachments_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register_attachments" ADD CONSTRAINT "general_register_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;