-- Migration: Add Form Mapping Datasets
-- This migration creates the form_mapping_datasets table for predefined mapping templates

CREATE TABLE IF NOT EXISTS "form_mapping_datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_module" "form_target_module" NOT NULL,
	"parish_id" uuid,
	"is_default" boolean DEFAULT false NOT NULL,
	"mappings" jsonb NOT NULL DEFAULT '[]'::jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "form_mapping_datasets" ADD CONSTRAINT "form_mapping_datasets_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_mapping_datasets" ADD CONSTRAINT "form_mapping_datasets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_mapping_datasets" ADD CONSTRAINT "form_mapping_datasets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;