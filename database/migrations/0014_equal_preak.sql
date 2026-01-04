ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_parish_code_unique";
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_parish_id_parishes_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN IF EXISTS "parish_id";
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_code_unique" UNIQUE("code");