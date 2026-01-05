-- Create stock_movement_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."stock_movement_type" AS ENUM('in', 'out', 'transfer', 'adjustment', 'return');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"parish_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"movement_date" date NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_cost" numeric(15, 4),
	"total_value" numeric(15, 2),
	"invoice_id" uuid,
	"invoice_item_index" integer,
	"document_type" varchar(50),
	"document_number" varchar(50),
	"document_date" date,
	"partner_id" uuid,
	"destination_warehouse_id" uuid,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add missing columns if table already exists (from old migration)
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
   -- Check and add invoice_id column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'invoice_id') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "invoice_id" uuid;
   END IF;
   
   -- Check and add invoice_item_index column
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'invoice_item_index') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "invoice_item_index" integer;
   END IF;
   
   -- Check and add unit_cost column (might already exist)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'unit_cost') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "unit_cost" numeric(15, 4);
   END IF;
   
   -- Check and add total_value column (might already exist)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'total_value') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "total_value" numeric(15, 2);
   END IF;
   
   -- Check and add destination_warehouse_id column (might already exist)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'destination_warehouse_id') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "destination_warehouse_id" uuid;
   END IF;
   
   -- Check and add created_by column (might already exist but in different position)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'created_by') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "created_by" uuid;
     -- Set a default user ID if available
     UPDATE "stock_movements" SET "created_by" = (SELECT id FROM users LIMIT 1) WHERE "created_by" IS NULL;
     -- Make NOT NULL only if we have a default value
     IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
       ALTER TABLE "stock_movements" ALTER COLUMN "created_by" SET NOT NULL;
     END IF;
   END IF;
   
   -- Check and add created_at column (might already exist)
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'created_at') THEN
     ALTER TABLE "stock_movements" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();
     UPDATE "stock_movements" SET "created_at" = now() WHERE "created_at" IS NULL;
     ALTER TABLE "stock_movements" ALTER COLUMN "created_at" SET NOT NULL;
   END IF;
   
   -- Update type column to use new enum if it exists with old enum
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'type' AND udt_name = 'movement_type') THEN
     -- Convert old enum values to new enum values
     ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "stock_movement_type" USING (
       CASE type::text
         WHEN 'receipt' THEN 'in'::stock_movement_type
         WHEN 'issue' THEN 'out'::stock_movement_type
         WHEN 'transfer_in' THEN 'in'::stock_movement_type
         WHEN 'transfer_out' THEN 'out'::stock_movement_type
         WHEN 'adjustment' THEN 'adjustment'::stock_movement_type
         WHEN 'sale' THEN 'out'::stock_movement_type
         WHEN 'return' THEN 'return'::stock_movement_type
         ELSE 'in'::stock_movement_type
       END
     );
   END IF;
 END IF;
END $$;
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_stock_movements_warehouse_product" ON "stock_movements" USING btree ("warehouse_id", "product_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_stock_movements_parish_date" ON "stock_movements" USING btree ("parish_id", "movement_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_stock_movements_type" ON "stock_movements" USING btree ("parish_id", "type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_stock_movements_partner" ON "stock_movements" USING btree ("partner_id") WHERE "partner_id" IS NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_stock_movements_invoice" ON "stock_movements" USING btree ("invoice_id") WHERE "invoice_id" IS NOT NULL;

