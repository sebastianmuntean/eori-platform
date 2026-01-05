-- Insert default warehouses for each parish
-- For each parish, creates three warehouses:
-- - Pangar {parish_name}
-- - Depozit {parish_name}
-- - Biserica {parish_name}

DO $$
DECLARE
    parish_record RECORD;
    default_user_id UUID;
    warehouse_code VARCHAR(20);
    warehouse_name VARCHAR(255);
BEGIN
    -- Get the first available user for created_by field
    -- If no users exist, this will fail gracefully
    SELECT id INTO default_user_id FROM users LIMIT 1;
    
    IF default_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the database. Please create at least one user before running this migration.';
    END IF;

    -- Loop through all active parishes
    FOR parish_record IN 
        SELECT id, name, code 
        FROM parishes 
        WHERE is_active = true
    LOOP
        -- Insert Pangar warehouse
        warehouse_code := 'PANGAR';
        warehouse_name := 'Pangar ' || parish_record.name;
        
        INSERT INTO warehouses (
            parish_id,
            code,
            name,
            type,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            parish_record.id,
            warehouse_code,
            warehouse_name,
            'general',
            true,
            default_user_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (parish_id, code) DO NOTHING;

        -- Insert Depozit warehouse
        warehouse_code := 'DEPOZIT';
        warehouse_name := 'Depozit ' || parish_record.name;
        
        INSERT INTO warehouses (
            parish_id,
            code,
            name,
            type,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            parish_record.id,
            warehouse_code,
            warehouse_name,
            'storage',
            true,
            default_user_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (parish_id, code) DO NOTHING;

        -- Insert Biserica warehouse
        warehouse_code := 'BISERICA';
        warehouse_name := 'Biserica ' || parish_record.name;
        
        INSERT INTO warehouses (
            parish_id,
            code,
            name,
            type,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            parish_record.id,
            warehouse_code,
            warehouse_name,
            'general',
            true,
            default_user_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (parish_id, code) DO NOTHING;

    END LOOP;

    RAISE NOTICE 'Default warehouses inserted successfully for all active parishes.';
END $$;

