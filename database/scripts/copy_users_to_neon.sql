-- Script SQL pentru copierea utilizatorilor din baza locală în Neon
-- 
-- ATENȚIE: Acest script șterge utilizatorii existenți din Neon înainte de a copia!
-- 
-- Utilizare:
--   1. Modifică connection strings-urile de mai jos
--   2. Rulează scriptul pe baza Neon (sau folosește psql)
--
-- SAU folosește scriptul export_users.sql pentru a genera INSERT statements
-- și apoi rulează fișierul generat pe Neon

-- Opțiune 1: Folosind dblink (dacă ai permisiuni)
-- Trebuie să instalezi extensia dblink: CREATE EXTENSION IF NOT EXISTS dblink;

DO $$
DECLARE
    local_db_conn text;
    user_count integer;
BEGIN
    -- MODIFICĂ connection string-ul bazei locale aici:
    local_db_conn := 'host=192.168.1.129 port=5433 dbname=eori_platform user=postgres password=superuser';
    
    RAISE NOTICE 'Starting user migration...';
    
    -- Șterge datele existente din Neon (opțional - comentează dacă vrei să păstrezi)
    RAISE NOTICE 'Deleting existing user data from Neon...';
    DELETE FROM user_roles;
    DELETE FROM sessions;
    DELETE FROM users;
    
    -- Copiază utilizatorii
    RAISE NOTICE 'Copying users...';
    INSERT INTO users (
        id, email, password_hash, name, address, city, phone,
        is_active, approval_status, role, parish_id, permissions,
        admin_notes, reset_token, reset_token_expiry,
        verification_code, verification_code_expiry,
        created_at, updated_at
    )
    SELECT 
        id, email, password_hash, name, address, city, phone,
        is_active, approval_status, role, parish_id, permissions,
        admin_notes, reset_token, reset_token_expiry,
        verification_code, verification_code_expiry,
        created_at, updated_at
    FROM dblink(local_db_conn,
        'SELECT id, email, password_hash, name, address, city, phone,
                is_active, approval_status, role, parish_id, permissions,
                admin_notes, reset_token, reset_token_expiry,
                verification_code, verification_code_expiry,
                created_at, updated_at
         FROM users'
    ) AS local_users (
        id uuid, email varchar, password_hash varchar, name varchar,
        address text, city text, phone text,
        is_active boolean, approval_status text, role text, parish_id uuid,
        permissions text[], admin_notes text,
        reset_token varchar, reset_token_expiry timestamp,
        verification_code varchar, verification_code_expiry timestamp,
        created_at timestamp, updated_at timestamp
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        phone = EXCLUDED.phone,
        is_active = EXCLUDED.is_active,
        approval_status = EXCLUDED.approval_status,
        role = EXCLUDED.role,
        parish_id = EXCLUDED.parish_id,
        permissions = EXCLUDED.permissions,
        admin_notes = EXCLUDED.admin_notes,
        reset_token = EXCLUDED.reset_token,
        reset_token_expiry = EXCLUDED.reset_token_expiry,
        verification_code = EXCLUDED.verification_code,
        verification_code_expiry = EXCLUDED.verification_code_expiry,
        updated_at = EXCLUDED.updated_at;
    
    GET DIAGNOSTICS user_count = ROW_COUNT;
    RAISE NOTICE 'Copied % users', user_count;
    
    -- Copiază user_roles
    RAISE NOTICE 'Copying user_roles...';
    INSERT INTO user_roles (id, user_id, role_id, created_at)
    SELECT id, user_id, role_id, created_at
    FROM dblink(local_db_conn,
        'SELECT id, user_id, role_id, created_at FROM user_roles'
    ) AS local_user_roles (
        id uuid, user_id uuid, role_id uuid, created_at timestamp
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        role_id = EXCLUDED.role_id;
    
    GET DIAGNOSTICS user_count = ROW_COUNT;
    RAISE NOTICE 'Copied % user_roles', user_count;
    
    -- Copiază sessions (opțional - probabil nu vrei să copiezi sesiunile)
    -- RAISE NOTICE 'Copying sessions...';
    -- INSERT INTO sessions (id, user_id, token, expires_at, created_at, ip_address, user_agent)
    -- SELECT id, user_id, token, expires_at, created_at, ip_address, user_agent
    -- FROM dblink(local_db_conn,
    --     'SELECT id, user_id, token, expires_at, created_at, ip_address, user_agent FROM sessions'
    -- ) AS local_sessions (
    --     id uuid, user_id uuid, token varchar, expires_at timestamp,
    --     created_at timestamp, ip_address varchar, user_agent text
    -- )
    -- ON CONFLICT (id) DO UPDATE SET
    --     user_id = EXCLUDED.user_id,
    --     token = EXCLUDED.token,
    --     expires_at = EXCLUDED.expires_at,
    --     ip_address = EXCLUDED.ip_address,
    --     user_agent = EXCLUDED.user_agent;
    
    RAISE NOTICE 'Migration completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during migration: %', SQLERRM;
END $$;

