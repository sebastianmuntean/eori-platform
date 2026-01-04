-- Seed register configurations for all parishes and episcopie
-- This script creates a register for each active parish and one for episcopie
-- IMPORTANT: Run this AFTER migration 0011_polite_daimon_hellstrom.sql (which creates the register_configurations table)

DO $$
DECLARE
    admin_user_id uuid;
    parish_record RECORD;
    register_count integer := 0;
    table_exists boolean;
BEGIN
    -- Check if register_configurations table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'register_configurations'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Table register_configurations does not exist. Please run migration 0011_polite_daimon_hellstrom.sql first.';
    END IF;
    
    -- Get first user for created_by (preferably admin, but any user will work)
    SELECT id INTO admin_user_id FROM users LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'No users found in database. Skipping register configurations seed.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Seeding register configurations with user ID: %', admin_user_id;
    
    -- Create register for each active parish
    FOR parish_record IN 
        SELECT id, name, code 
        FROM parishes 
        WHERE is_active = true
    LOOP
        -- Check if register already exists for this parish
        IF NOT EXISTS (
            SELECT 1 
            FROM register_configurations 
            WHERE parish_id = parish_record.id
        ) THEN
            INSERT INTO register_configurations (
                id,
                name,
                parish_id,
                resets_annually,
                starting_number,
                notes,
                created_by,
                created_at,
                updated_at,
                updated_by
            ) VALUES (
                gen_random_uuid(),
                'Registru ' || parish_record.name,
                parish_record.id,
                true, -- Reset annually
                1,    -- Starting number
                'Registru pentru parohia ' || parish_record.name || ' (' || parish_record.code || ')',
                admin_user_id,
                now(),
                now(),
                admin_user_id
            );
            
            register_count := register_count + 1;
            RAISE NOTICE 'Created register for parish: % (%)', parish_record.name, parish_record.code;
        ELSE
            RAISE NOTICE 'Register already exists for parish: % (%), skipping', parish_record.name, parish_record.code;
        END IF;
    END LOOP;
    
    -- Create register for episcopie (no parish)
    IF NOT EXISTS (
        SELECT 1 
        FROM register_configurations 
        WHERE parish_id IS NULL
    ) THEN
        INSERT INTO register_configurations (
            id,
            name,
            parish_id,
            resets_annually,
            starting_number,
            notes,
            created_by,
            created_at,
            updated_at,
            updated_by
        ) VALUES (
            gen_random_uuid(),
            'Registru Episcopie',
            NULL, -- No parish for episcopie
            true, -- Reset annually
            1,    -- Starting number
            'Registru pentru episcopie (fără parohie specifică)',
            admin_user_id,
            now(),
            now(),
            admin_user_id
        );
        
        register_count := register_count + 1;
        RAISE NOTICE 'Created register for episcopie';
    ELSE
        RAISE NOTICE 'Register for episcopie already exists, skipping';
    END IF;
    
    RAISE NOTICE 'Register configurations seeding completed. Created % register(s).', register_count;
END $$;

