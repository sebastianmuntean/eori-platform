-- Script SQL pentru generarea INSERT statements pentru utilizatori
-- Rulează acest script pe baza LOCALĂ pentru a genera INSERT statements
-- 
-- Utilizare:
--   psql "postgresql://postgres:superuser@192.168.1.129:5433/eori_platform" -f database/scripts/generate_users_insert.sql -o users_insert.sql
--   Apoi rulează users_insert.sql pe baza Neon

\set ON_ERROR_STOP on

\echo '-- ============================================'
\echo '-- Export Users and Related Data'
\echo '-- Generated on: ' :'now'
\echo '-- ============================================'
\echo ''
\echo 'BEGIN;'
\echo ''

-- Export users
\echo '-- Exporting users table...'
SELECT 
    'INSERT INTO users (id, email, password_hash, name, address, city, phone, is_active, approval_status, role, parish_id, permissions, admin_notes, reset_token, reset_token_expiry, verification_code, verification_code_expiry, created_at, updated_at) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(email) || ', ' ||
    quote_literal(password_hash) || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(quote_literal(address), 'NULL') || ', ' ||
    COALESCE(quote_literal(city), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    is_active || ', ' ||
    quote_literal(approval_status::text) || '::approval_status, ' ||
    quote_literal(role::text) || '::user_role, ' ||
    COALESCE(quote_literal(parish_id::text) || '::uuid', 'NULL') || ', ' ||
    CASE 
        WHEN permissions IS NULL OR array_length(permissions, 1) IS NULL THEN '''{}'''
        ELSE quote_literal('{' || array_to_string(permissions, ',') || '}')
    END || '::text[], ' ||
    COALESCE(quote_literal(admin_notes), 'NULL') || ', ' ||
    COALESCE(quote_literal(reset_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(reset_token_expiry), 'NULL') || '::timestamp, ' ||
    COALESCE(quote_literal(verification_code), 'NULL') || ', ' ||
    COALESCE(quote_literal(verification_code_expiry), 'NULL') || '::timestamp, ' ||
    quote_literal(created_at) || '::timestamp, ' ||
    quote_literal(updated_at) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'email = EXCLUDED.email, ' ||
    'password_hash = EXCLUDED.password_hash, ' ||
    'name = EXCLUDED.name, ' ||
    'address = EXCLUDED.address, ' ||
    'city = EXCLUDED.city, ' ||
    'phone = EXCLUDED.phone, ' ||
    'is_active = EXCLUDED.is_active, ' ||
    'approval_status = EXCLUDED.approval_status, ' ||
    'role = EXCLUDED.role, ' ||
    'parish_id = EXCLUDED.parish_id, ' ||
    'permissions = EXCLUDED.permissions, ' ||
    'admin_notes = EXCLUDED.admin_notes, ' ||
    'reset_token = EXCLUDED.reset_token, ' ||
    'reset_token_expiry = EXCLUDED.reset_token_expiry, ' ||
    'verification_code = EXCLUDED.verification_code, ' ||
    'verification_code_expiry = EXCLUDED.verification_code_expiry, ' ||
    'updated_at = EXCLUDED.updated_at;'
FROM users
ORDER BY created_at;

\echo ''
\echo '-- Exporting user_roles table...'
SELECT 
    'INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(role_id::text) || '::uuid, ' ||
    quote_literal(created_at) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'user_id = EXCLUDED.user_id, ' ||
    'role_id = EXCLUDED.role_id;'
FROM user_roles
ORDER BY created_at;

\echo ''
\echo 'COMMIT;'
\echo ''
\echo '-- Export completed successfully!'

