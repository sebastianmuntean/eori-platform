-- Add optional warehouse_id to invoices table for invoices that affect stock
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "warehouse_id" uuid;
--> statement-breakpoint

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_invoices_warehouse" ON "invoices" USING btree ("warehouse_id") WHERE "warehouse_id" IS NOT NULL;

