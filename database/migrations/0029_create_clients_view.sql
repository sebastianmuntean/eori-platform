-- Create a view for clients with calculated "name" field
-- name = companyName for companies, firstName + lastName for individuals
CREATE OR REPLACE VIEW "clients_view" AS
SELECT 
    id,
    code,
    first_name,
    last_name,
    cnp,
    birth_date,
    company_name,
    cui,
    reg_com,
    address,
    city,
    county,
    postal_code,
    phone,
    email,
    bank_name,
    iban,
    notes,
    is_active,
    created_at,
    created_by,
    updated_at,
    updated_by,
    deleted_at,
    -- Calculated name field: companyName for companies, firstName + lastName for individuals
    COALESCE(
        company_name,
        TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
    ) AS name
FROM clients
WHERE deleted_at IS NULL;

