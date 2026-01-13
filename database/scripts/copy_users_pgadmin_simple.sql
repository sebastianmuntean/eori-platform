-- ============================================
-- Script SQL Simplu pentru pgAdmin
-- Copiază utilizatorii din baza locală în Neon
-- ============================================
--
-- PAȘI:
--   1. Conectează-te la baza LOCALĂ în pgAdmin
--   2. Rulează acest script (F5)
--   3. Copiază TOATE rândurile din rezultat (Ctrl+A, Ctrl+C)
--   4. Conectează-te la baza NEON în pgAdmin  
--   5. Lipește și rulează (F5)
--
-- ============================================

-- Începe tranzacția
BEGIN;

-- Șterge utilizatorii existenți din Neon (opțional - decomentează dacă vrei)
-- DELETE FROM user_roles;
-- DELETE FROM sessions;
-- DELETE FROM users;

-- ============================================
-- USERS
-- ============================================

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
    'updated_at = EXCLUDED.updated_at;' AS sql_command
FROM users
ORDER BY created_at;

-- ============================================
-- USER_ROLES
-- ============================================

SELECT 
    'INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(role_id::text) || '::uuid, ' ||
    quote_literal(created_at) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'user_id = EXCLUDED.user_id, ' ||
    'role_id = EXCLUDED.role_id;' AS sql_command
FROM user_roles
ORDER BY created_at;

-- Finalizează tranzacția (va fi rulat pe Neon)
-- COMMIT;

