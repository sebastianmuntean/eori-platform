DO $$ BEGIN
 CREATE TYPE "approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approval_status" "approval_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code_expiry" timestamp with time zone;