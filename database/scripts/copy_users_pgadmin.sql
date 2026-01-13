-- ============================================
-- Script SQL pentru copierea utilizatorilor în Neon
-- Folosește acest script în pgAdmin
-- ============================================
--
-- INSTRUCȚIUNI:
--   1. Conectează-te la baza LOCALĂ în pgAdmin
--   2. Deschide Query Tool
--   3. Rulează acest script (F5)
--   4. Copiază rezultatul (toate rândurile cu INSERT)
--   5. Conectează-te la baza Neon în pgAdmin
--   6. Deschide Query Tool
--   7. Lipește și rulează INSERT statements-urile copiate
--
-- ============================================

-- Opțional: Șterge utilizatorii existenți din Neon (decomentează dacă vrei)
-- DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users);
-- DELETE FROM sessions WHERE user_id IN (SELECT id FROM users);
-- DELETE FROM users;

-- ============================================
-- GENEREAZĂ INSERT STATEMENTS PENTRU USERS
-- ============================================
-- Copiază output-ul de mai jos și rulează-l pe Neon

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
    'updated_at = EXCLUDED.updated_at;' AS insert_statement
FROM users
ORDER BY created_at;

-- ============================================
-- GENEREAZĂ INSERT STATEMENTS PENTRU USER_ROLES
-- ============================================
-- Copiază output-ul de mai jos și rulează-l pe Neon

SELECT 
    'INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(role_id::text) || '::uuid, ' ||
    quote_literal(created_at) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'user_id = EXCLUDED.user_id, ' ||
    'role_id = EXCLUDED.role_id;' AS insert_statement
FROM user_roles
ORDER BY created_at;

