-- ============================================
-- ASSIGN ALL PERMISSIONS TO SUPERADMIN ROLE
-- ============================================
-- 
-- This script assigns ALL permissions from the database to the superadmin role.
-- It uses ON CONFLICT DO NOTHING to avoid duplicates if permissions are already assigned.
--
-- Run this script manually using your PostgreSQL client:
--   psql $DATABASE_URL -f database/migrations/assign_all_permissions_to_superadmin.sql
--   or using pgAdmin or another GUI tool
--

DO $$
DECLARE
    superadmin_role_id uuid;
    permission_record record;
    permissions_count integer;
BEGIN
    -- Get superadmin role ID
    SELECT id INTO superadmin_role_id FROM roles WHERE name = 'superadmin' LIMIT 1;
    
    IF superadmin_role_id IS NULL THEN
        RAISE EXCEPTION 'Superadmin role not found. Please ensure the superadmin role exists in the roles table.';
    END IF;
    
    RAISE NOTICE 'Found superadmin role with ID: %', superadmin_role_id;
    
    -- Assign ALL permissions to superadmin role
    FOR permission_record IN 
        SELECT id FROM permissions
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (superadmin_role_id, permission_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Display summary
    SELECT COUNT(*) INTO permissions_count
    FROM role_permissions
    WHERE role_id = superadmin_role_id;
    
    RAISE NOTICE 'Total permissions assigned to superadmin role: %', permissions_count;
    
END $$;

-- Verify the assignment
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'superadmin'
GROUP BY r.id, r.name;

