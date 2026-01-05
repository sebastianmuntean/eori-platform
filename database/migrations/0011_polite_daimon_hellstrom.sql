CREATE TABLE "register_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"parish_id" uuid,
	"resets_annually" boolean DEFAULT false NOT NULL,
	"starting_number" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
-- Make parish_id nullable
ALTER TABLE "general_register" ALTER COLUMN "parish_id" DROP NOT NULL;
--> statement-breakpoint

-- Convert document_number from varchar to integer
-- Extract numeric part if format is "number/year" or just use the number
ALTER TABLE "general_register" ALTER COLUMN "document_number" TYPE integer USING (
    CASE 
        WHEN document_number ~ '^[0-9]+$' THEN document_number::integer
        WHEN document_number ~ '^[0-9]+/' THEN (regexp_split_to_array(document_number, '/'))[1]::integer
        ELSE 1
    END
);
--> statement-breakpoint

-- Add new columns
ALTER TABLE "general_register" ADD COLUMN "register_configuration_id" uuid;
--> statement-breakpoint

ALTER TABLE "general_register" ADD COLUMN "year" integer;
--> statement-breakpoint

-- Add foreign key constraints for register_configurations
DO $$ BEGIN
 ALTER TABLE "register_configurations" ADD CONSTRAINT "register_configurations_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "register_configurations" ADD CONSTRAINT "register_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "register_configurations" ADD CONSTRAINT "register_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add foreign key for general_register -> register_configurations (with shorter constraint name)
DO $$ BEGIN
 ALTER TABLE "general_register" ADD CONSTRAINT "general_register_register_config_id_fk" FOREIGN KEY ("register_configuration_id") REFERENCES "public"."register_configurations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Set default values for existing rows (if any)
-- Extract year from date column
UPDATE "general_register" 
SET "year" = EXTRACT(YEAR FROM "date")
WHERE "year" IS NULL;
--> statement-breakpoint

-- Set default year to current year if date is null
UPDATE "general_register" 
SET "year" = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE "year" IS NULL;
--> statement-breakpoint

-- Make year NOT NULL after setting defaults
ALTER TABLE "general_register" ALTER COLUMN "year" SET NOT NULL;
--> statement-breakpoint

-- IMPORTANT: If you have existing documents in general_register, you need to:
-- 1. Create register configurations (run seed script: database/seeds/0028_seed_register_configurations.sql)
-- 2. Update existing documents to set register_configuration_id
-- 3. Then make register_configuration_id NOT NULL (see below)

-- After updating existing documents, uncomment the following line to make register_configuration_id required:
-- ALTER TABLE "general_register" ALTER COLUMN "register_configuration_id" SET NOT NULL;