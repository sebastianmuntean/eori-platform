-- Update existing general_register documents with register_configuration_id
-- Run this AFTER:
-- 1. Migration 0011_polite_daimon_hellstrom.sql
-- 2. Seed 0028_seed_register_configurations.sql
-- 
-- This script assigns existing documents to appropriate register configurations
-- based on their parish_id

DO $$
DECLARE
    doc_record RECORD;
    register_config_id uuid;
    updated_count integer := 0;
    skipped_count integer := 0;
BEGIN
    -- Update documents that have a parish_id
    FOR doc_record IN 
        SELECT id, parish_id
        FROM general_register
        WHERE register_configuration_id IS NULL
        AND parish_id IS NOT NULL
    LOOP
        -- Find register configuration for this parish
        SELECT id INTO register_config_id
        FROM register_configurations
        WHERE parish_id = doc_record.parish_id
        LIMIT 1;
        
        IF register_config_id IS NOT NULL THEN
            UPDATE general_register
            SET register_configuration_id = register_config_id
            WHERE id = doc_record.id;
            
            updated_count := updated_count + 1;
        ELSE
            RAISE NOTICE 'No register configuration found for parish_id: %. Document ID: %', doc_record.parish_id, doc_record.id;
            skipped_count := skipped_count + 1;
        END IF;
    END LOOP;
    
    -- Update documents without parish_id (episcopie documents)
    FOR doc_record IN 
        SELECT id
        FROM general_register
        WHERE register_configuration_id IS NULL
        AND parish_id IS NULL
    LOOP
        -- Find episcopie register configuration
        SELECT id INTO register_config_id
        FROM register_configurations
        WHERE parish_id IS NULL
        LIMIT 1;
        
        IF register_config_id IS NOT NULL THEN
            UPDATE general_register
            SET register_configuration_id = register_config_id
            WHERE id = doc_record.id;
            
            updated_count := updated_count + 1;
        ELSE
            RAISE NOTICE 'No episcopie register configuration found. Document ID: %', doc_record.id;
            skipped_count := skipped_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % document(s) with register_configuration_id. Skipped % document(s).', updated_count, skipped_count;
    
    -- Check if there are any documents still without register_configuration_id
    IF EXISTS (SELECT 1 FROM general_register WHERE register_configuration_id IS NULL) THEN
        RAISE WARNING 'Some documents still have NULL register_configuration_id. Please review and update manually.';
    ELSE
        RAISE NOTICE 'All documents have been assigned to register configurations.';
        RAISE NOTICE 'You can now make register_configuration_id NOT NULL by running:';
        RAISE NOTICE 'ALTER TABLE "general_register" ALTER COLUMN "register_configuration_id" SET NOT NULL;';
    END IF;
END $$;




