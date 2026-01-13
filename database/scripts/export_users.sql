-- Script pentru exportarea utilizatorilor și datelor asociate
-- Rulează acest script pe baza de date LOCALĂ pentru a genera INSERT statements
-- 
-- Utilizare:
--   psql $LOCAL_DATABASE_URL -f database/scripts/export_users.sql > users_export.sql
--   Apoi rulează users_export.sql pe baza Neon

\echo '-- Export Users and Related Data'
\echo '-- Generated on: ' `date`
\echo ''

-- Export users table
\echo '-- Exporting users...'
\echo 'BEGIN;'
\echo ''
\echo '-- Delete existing users (optional - comment out if you want to keep existing)'
\echo '-- DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users);'
\echo '-- DELETE FROM sessions WHERE user_id IN (SELECT id FROM users);'
\echo '-- DELETE FROM users;'
\echo ''

\echo '-- Insert users'
SELECT 
    'INSERT INTO users (id, email, password_hash, name, address, city, phone, is_active, approval_status, role, parish_id, permissions, admin_notes, reset_token, reset_token_expiry, verification_code, verification_code_expiry, created_at, updated_at) VALUES (' ||
    quote_literal(id::text) || ', ' ||
    quote_literal(email) || ', ' ||
    quote_literal(password_hash) || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(quote_literal(address), 'NULL') || ', ' ||
    COALESCE(quote_literal(city), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    is_active || ', ' ||
    quote_literal(approval_status::text) || ', ' ||
    quote_literal(role::text) || ', ' ||
    COALESCE(quote_literal(parish_id::text), 'NULL') || ', ' ||
    CASE 
        WHEN permissions IS NULL OR array_length(permissions, 1) IS NULL THEN '''{}'''
        ELSE quote_literal('{' || array_to_string(permissions, ',') || '}')
    END || ', ' ||
    COALESCE(quote_literal(admin_notes), 'NULL') || ', ' ||
    COALESCE(quote_literal(reset_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(reset_token_expiry::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(verification_code), 'NULL') || ', ' ||
    COALESCE(quote_literal(verification_code_expiry::text), 'NULL') || ', ' ||
    quote_literal(created_at::text) || ', ' ||
    quote_literal(updated_at::text) ||
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
\echo '-- Exporting user_roles...'
SELECT 
    'INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (' ||
    quote_literal(id::text) || ', ' ||
    quote_literal(user_id::text) || ', ' ||
    quote_literal(role_id::text) || ', ' ||
    quote_literal(created_at::text) ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'user_id = EXCLUDED.user_id, ' ||
    'role_id = EXCLUDED.role_id;'
FROM user_roles
ORDER BY created_at;

\echo ''
\echo '-- Exporting sessions (optional - you may want to skip these)'
SELECT 
    'INSERT INTO sessions (id, user_id, token, expires_at, created_at, ip_address, user_agent) VALUES (' ||
    quote_literal(id::text) || ', ' ||
    quote_literal(user_id::text) || ', ' ||
    quote_literal(token) || ', ' ||
    quote_literal(expires_at::text) || ', ' ||
    quote_literal(created_at::text) || ', ' ||
    COALESCE(quote_literal(ip_address), 'NULL') || ', ' ||
    COALESCE(quote_literal(user_agent), 'NULL') ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'user_id = EXCLUDED.user_id, ' ||
    'token = EXCLUDED.token, ' ||
    'expires_at = EXCLUDED.expires_at, ' ||
    'ip_address = EXCLUDED.ip_address, ' ||
    'user_agent = EXCLUDED.user_agent;'
FROM sessions
ORDER BY created_at;

\echo ''
\echo 'COMMIT;'
\echo ''
\echo '-- Export completed'

