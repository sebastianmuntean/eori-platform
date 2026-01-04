-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"unit" varchar(20) DEFAULT 'buc' NOT NULL,
	"purchase_price" numeric(15, 2),
	"sale_price" numeric(15, 2),
	"vat_rate" numeric(5, 2) DEFAULT '19',
	"barcode" varchar(100),
	"track_stock" boolean DEFAULT true,
	"min_stock" numeric(10, 3),
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "products_parish_id_code_unique" UNIQUE("parish_id","code")
);
--> statement-breakpoint

-- Add missing columns if table already exists (from old migration)
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
   -- Check and add created_by column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_by') THEN
     -- First add as nullable, then update with a default user, then make NOT NULL
     ALTER TABLE "products" ADD COLUMN "created_by" uuid;
     -- Set a default user ID if available, otherwise leave NULL (will need manual update)
     UPDATE "products" SET "created_by" = (SELECT id FROM users LIMIT 1) WHERE "created_by" IS NULL;
     -- Make NOT NULL only if we have a default value
     IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
       ALTER TABLE "products" ALTER COLUMN "created_by" SET NOT NULL;
     END IF;
   END IF;
   
   -- Check and add created_at column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
     ALTER TABLE "products" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
     UPDATE "products" SET "created_at" = now() WHERE "created_at" IS NULL;
     ALTER TABLE "products" ALTER COLUMN "created_at" SET NOT NULL;
   END IF;
   
   -- Check and add updated_at column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
     ALTER TABLE "products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
     UPDATE "products" SET "updated_at" = now() WHERE "updated_at" IS NULL;
     ALTER TABLE "products" ALTER COLUMN "updated_at" SET NOT NULL;
   END IF;
   
   -- Check and add updated_by column (nullable, so no issue)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_by') THEN
     ALTER TABLE "products" ADD COLUMN "updated_by" uuid;
   END IF;
   
   -- Check and add track_stock column if missing
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'track_stock') THEN
     ALTER TABLE "products" ADD COLUMN "track_stock" boolean DEFAULT true;
   END IF;
 END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_products_parish" ON "products" USING btree ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_products_active" ON "products" USING btree ("parish_id", "is_active");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" USING btree ("parish_id", "category");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_products_barcode" ON "products" USING btree ("barcode") WHERE "barcode" IS NOT NULL;

