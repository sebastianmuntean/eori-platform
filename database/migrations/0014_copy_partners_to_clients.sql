-- Migration script to copy data from partners to clients table
-- This script copies all partners into the clients table, excluding type and category fields

-- Copy all partners to clients
-- Using ON CONFLICT to handle duplicate (parish_id, code) combinations gracefully
INSERT INTO "clients" (
    "id",
    "parish_id",
    "code",
    "first_name",
    "last_name",
    "cnp",
    "birth_date",
    "company_name",
    "cui",
    "reg_com",
    "address",
    "city",
    "county",
    "postal_code",
    "phone",
    "email",
    "bank_name",
    "iban",
    "notes",
    "is_active",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at"
)
SELECT 
    "id",
    "parish_id",
    "code",
    "first_name",
    "last_name",
    "cnp",
    "birth_date",
    "company_name",
    "cui",
    "reg_com",
    "address",
    "city",
    "county",
    "postal_code",
    "phone",
    "email",
    "bank_name",
    "iban",
    "notes",
    "is_active",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at"
FROM "partners"
WHERE NOT EXISTS (
    -- Skip partners that already exist in clients (same parish_id and code)
    SELECT 1 
    FROM "clients" 
    WHERE "clients"."parish_id" = "partners"."parish_id" 
      AND "clients"."code" = "partners"."code"
)
ON CONFLICT ("parish_id", "code") DO NOTHING;

-- Display summary
DO $$
DECLARE
    partners_count INTEGER;
    clients_count INTEGER;
    copied_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO partners_count FROM "partners";
    SELECT COUNT(*) INTO clients_count FROM "clients";
    copied_count := clients_count;
    
    RAISE NOTICE 'Migration summary:';
    RAISE NOTICE '  Partners in source table: %', partners_count;
    RAISE NOTICE '  Clients after migration: %', clients_count;
    RAISE NOTICE '  Records copied: %', copied_count;
END $$;



