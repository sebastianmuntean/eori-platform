-- Create inventory_session_status enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."inventory_session_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create inventory_item_type enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "public"."inventory_item_type" AS ENUM('product', 'fixed_asset');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create inventory_sessions table
CREATE TABLE IF NOT EXISTS "inventory_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"date" date NOT NULL,
	"status" "inventory_session_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"item_type" "inventory_item_type" NOT NULL,
	"item_id" uuid NOT NULL,
	"book_quantity" numeric(10, 3),
	"physical_quantity" numeric(10, 3),
	"difference" numeric(10, 3),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_session_id_inventory_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."inventory_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_inventory_sessions_parish_id" ON "inventory_sessions" USING btree ("parish_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_sessions_warehouse_id" ON "inventory_sessions" USING btree ("warehouse_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_sessions_status" ON "inventory_sessions" USING btree ("status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_sessions_date" ON "inventory_sessions" USING btree ("date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_items_session_id" ON "inventory_items" USING btree ("session_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_items_item_type_item_id" ON "inventory_items" USING btree ("item_type", "item_id");
--> statement-breakpoint

