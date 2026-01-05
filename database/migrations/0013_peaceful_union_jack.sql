CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parish_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"cnp" varchar(13),
	"birth_date" date,
	"company_name" varchar(255),
	"cui" varchar(20),
	"reg_com" varchar(50),
	"address" text,
	"city" varchar(100),
	"county" varchar(100),
	"postal_code" varchar(20),
	"phone" varchar(50),
	"email" varchar(255),
	"bank_name" varchar(255),
	"iban" varchar(34),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "general_register" ADD COLUMN "petent_client_id" uuid;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_register" ADD CONSTRAINT "general_register_petent_client_id_clients_id_fk" FOREIGN KEY ("petent_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_parish_code_unique" UNIQUE("parish_id","code");