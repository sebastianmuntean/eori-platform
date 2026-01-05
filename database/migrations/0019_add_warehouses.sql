-- Create warehouse_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."warehouse_type" AS ENUM('general', 'retail', 'storage', 'temporary');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create warehouses table
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "warehouse_type" DEFAULT 'general' NOT NULL,
	"address" text,
	"responsible_name" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "warehouses_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Add missing columns if table already exists (from old migration)
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses') THEN
   -- Check and add created_by column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name = 'created_by') THEN
     -- First add as nullable, then update with a default user, then make NOT NULL
     ALTER TABLE "warehouses" ADD COLUMN "created_by" uuid;
     -- Set a default user ID if available, otherwise leave NULL (will need manual update)
     UPDATE "warehouses" SET "created_by" = (SELECT id FROM users LIMIT 1) WHERE "created_by" IS NULL;
     -- Make NOT NULL only if we have a default value
     IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
       ALTER TABLE "warehouses" ALTER COLUMN "created_by" SET NOT NULL;
     END IF;
   END IF;
   
   -- Check and add created_at column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name = 'created_at') THEN
     ALTER TABLE "warehouses" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
     UPDATE "warehouses" SET "created_at" = now() WHERE "created_at" IS NULL;
     ALTER TABLE "warehouses" ALTER COLUMN "created_at" SET NOT NULL;
   END IF;
   
   -- Check and add updated_at column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name = 'updated_at') THEN
     ALTER TABLE "warehouses" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
     UPDATE "warehouses" SET "updated_at" = now() WHERE "updated_at" IS NULL;
     ALTER TABLE "warehouses" ALTER COLUMN "updated_at" SET NOT NULL;
   END IF;
   
   -- Check and add updated_by column (nullable, so no issue)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name = 'updated_by') THEN
     ALTER TABLE "warehouses" ADD COLUMN "updated_by" uuid;
   END IF;
 END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_warehouses_parish" ON "warehouses" USING btree ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_warehouses_active" ON "warehouses" USING btree ("parish_id", "is_active");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_warehouses_type" ON "warehouses" USING btree ("parish_id", "type");

