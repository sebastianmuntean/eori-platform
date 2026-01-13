-- ============================================
-- Creează utilizator Superadmin cu toate drepturile
-- ============================================
-- 
-- PAROLA: Admin123!
-- Email: admin@eori.ro
-- 
-- Rulează acest script pe baza Neon în pgAdmin
-- ============================================

BEGIN;

-- Parola hash-uită pentru: Admin123!
-- Hash generat cu bcrypt (12 rounds)
DO $$
DECLARE
    superadmin_user_id uuid;
    superadmin_role_id uuid;
    user_exists boolean;
    role_exists boolean;
BEGIN
    -- Verifică dacă utilizatorul există deja
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@eori.ro') INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Utilizatorul admin@eori.ro există deja. Se va actualiza.';
        SELECT id INTO superadmin_user_id FROM users WHERE email = 'admin@eori.ro' LIMIT 1;
        
        -- Actualizează utilizatorul existent
        UPDATE users SET
            password_hash = '$2a$12$RFFMfjC9SM2zinyh.khogewSxS6L2c4nIroth3gK2J6lvVvNaXVu.',
            name = 'Super Administrator',
            is_active = true,
            approval_status = 'approved',
            role = 'episcop',
            updated_at = NOW()
        WHERE id = superadmin_user_id;
    ELSE
        -- Creează utilizatorul nou
        INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            address,
            city,
            phone,
            is_active,
            approval_status,
            role,
            parish_id,
            permissions,
            admin_notes,
            reset_token,
            reset_token_expiry,
            verification_code,
            verification_code_expiry,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'admin@eori.ro',
            '$2a$12$RFFMfjC9SM2zinyh.khogewSxS6L2c4nIroth3gK2J6lvVvNaXVu.',
            'Super Administrator',
            NULL,
            NULL,
            NULL,
            true,
            'approved',
            'episcop',
            NULL,
            '{}',
            'Superadmin creat automat',
            NULL,
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
        ) RETURNING id INTO superadmin_user_id;
        
        RAISE NOTICE 'Utilizator creat cu ID: %', superadmin_user_id;
    END IF;
    
    -- Verifică dacă rolul superadmin există
    SELECT EXISTS(SELECT 1 FROM roles WHERE name = 'superadmin') INTO role_exists;
    
    IF NOT role_exists THEN
        -- Creează rolul superadmin dacă nu există
        INSERT INTO roles (id, name, description, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'superadmin',
            'Super Administrator - Acces complet la toate funcțiile sistemului',
            NOW(),
            NOW()
        ) RETURNING id INTO superadmin_role_id;
        
        RAISE NOTICE 'Rol superadmin creat cu ID: %', superadmin_role_id;
    ELSE
        SELECT id INTO superadmin_role_id FROM roles WHERE name = 'superadmin' LIMIT 1;
        RAISE NOTICE 'Rol superadmin există deja cu ID: %', superadmin_role_id;
    END IF;
    
    -- Asignează rolul superadmin utilizatorului
    INSERT INTO user_roles (id, user_id, role_id, created_at)
    VALUES (
        gen_random_uuid(),
        superadmin_user_id,
        superadmin_role_id,
        NOW()
    )
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Rol superadmin asignat utilizatorului';
    
    -- Asigură că rolul superadmin are TOATE permisiunile
    -- Folosește scriptul existent pentru a asigna toate permisiunile
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        superadmin_role_id,
        p.id
    FROM permissions p
    WHERE NOT EXISTS (
        SELECT 1 
        FROM role_permissions rp 
        WHERE rp.role_id = superadmin_role_id 
        AND rp.permission_id = p.id
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Toate permisiunile au fost asignate rolului superadmin';
    
END $$;

-- Verificare finală
SELECT 
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.approval_status,
    u.role,
    r.name as role_name,
    COUNT(DISTINCT rp.permission_id) as total_permissions
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.email = 'admin@eori.ro'
GROUP BY u.id, u.email, u.name, u.is_active, u.approval_status, u.role, r.name;

COMMIT;

-- ============================================
-- REZUMAT:
-- ============================================
-- Email: admin@eori.ro
-- Parola: Admin123!
-- Rol: superadmin (cu toate permisiunile)
-- Status: activ și aprobat
-- ============================================

