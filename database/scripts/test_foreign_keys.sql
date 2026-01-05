-- SQL Script to Test All Foreign Key Relationships
-- This script verifies all foreign key constraints in the database
-- and checks for orphaned records (FK values without corresponding records)

-- Create a temporary table to store results
CREATE TEMP TABLE IF NOT EXISTS fk_test_results (
    constraint_name TEXT,
    table_schema TEXT,
    table_name TEXT,
    column_name TEXT,
    referenced_table_schema TEXT,
    referenced_table_name TEXT,
    referenced_column_name TEXT,
    status TEXT,
    orphaned_count BIGINT,
    error_message TEXT
);

-- Clear any existing results
TRUNCATE TABLE fk_test_results;

-- Function to check FK relationships and orphaned records
DO $$
DECLARE
    fk_record RECORD;
    orphaned_count BIGINT;
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    ref_table_exists BOOLEAN;
    ref_column_exists BOOLEAN;
    test_query TEXT;
    error_msg TEXT;
BEGIN
    -- Loop through all foreign key constraints
    FOR fk_record IN
        SELECT
            tc.constraint_name,
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema AS referenced_table_schema,
            ccu.table_name AS referenced_table_name,
            ccu.column_name AS referenced_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
    LOOP
        -- Reset variables
        orphaned_count := 0;
        error_msg := NULL;
        table_exists := FALSE;
        column_exists := FALSE;
        ref_table_exists := FALSE;
        ref_column_exists := FALSE;

        BEGIN
            -- Check if referencing table exists
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = fk_record.table_schema
                AND table_name = fk_record.table_name
            ) INTO table_exists;

            -- Check if referencing column exists
            IF table_exists THEN
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_schema = fk_record.table_schema
                    AND table_name = fk_record.table_name
                    AND column_name = fk_record.column_name
                ) INTO column_exists;
            END IF;

            -- Check if referenced table exists
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = fk_record.referenced_table_schema
                AND table_name = fk_record.referenced_table_name
            ) INTO ref_table_exists;

            -- Check if referenced column exists
            IF ref_table_exists THEN
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_schema = fk_record.referenced_table_schema
                    AND table_name = fk_record.referenced_table_name
                    AND column_name = fk_record.referenced_column_name
                ) INTO ref_column_exists;
            END IF;

            -- Validate FK structure
            IF NOT table_exists THEN
                error_msg := 'Referencing table does not exist';
            ELSIF NOT column_exists THEN
                error_msg := 'Referencing column does not exist';
            ELSIF NOT ref_table_exists THEN
                error_msg := 'Referenced table does not exist';
            ELSIF NOT ref_column_exists THEN
                error_msg := 'Referenced column does not exist';
            ELSE
                -- All structures exist, check for orphaned records
                -- Only check if the referencing table has data
                BEGIN
                    test_query := format(
                        'SELECT COUNT(*) FROM %I.%I t1 WHERE t1.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I.%I t2 WHERE t2.%I = t1.%I)',
                        fk_record.table_schema,
                        fk_record.table_name,
                        fk_record.column_name,
                        fk_record.referenced_table_schema,
                        fk_record.referenced_table_name,
                        fk_record.referenced_column_name,
                        fk_record.column_name
                    );
                    
                    EXECUTE test_query INTO orphaned_count;
                EXCEPTION WHEN OTHERS THEN
                    error_msg := 'Error checking orphaned records: ' || SQLERRM;
                END;
            END IF;

            -- Insert result
            INSERT INTO fk_test_results (
                constraint_name,
                table_schema,
                table_name,
                column_name,
                referenced_table_schema,
                referenced_table_name,
                referenced_column_name,
                status,
                orphaned_count,
                error_message
            ) VALUES (
                fk_record.constraint_name,
                fk_record.table_schema,
                fk_record.table_name,
                fk_record.column_name,
                fk_record.referenced_table_schema,
                fk_record.referenced_table_name,
                fk_record.referenced_column_name,
                CASE 
                    WHEN error_msg IS NOT NULL THEN 'ERROR'
                    WHEN orphaned_count > 0 THEN 'ORPHANED'
                    ELSE 'OK'
                END,
                orphaned_count,
                error_msg
            );

        EXCEPTION WHEN OTHERS THEN
            -- Handle any unexpected errors
            INSERT INTO fk_test_results (
                constraint_name,
                table_schema,
                table_name,
                column_name,
                referenced_table_schema,
                referenced_table_name,
                referenced_column_name,
                status,
                orphaned_count,
                error_message
            ) VALUES (
                fk_record.constraint_name,
                fk_record.table_schema,
                fk_record.table_name,
                fk_record.column_name,
                fk_record.referenced_table_schema,
                fk_record.referenced_table_name,
                fk_record.referenced_column_name,
                'ERROR',
                0,
                'Unexpected error: ' || SQLERRM
            );
        END;
    END LOOP;
END $$;

-- Display Summary
SELECT 
    '=================================================================' as "Report";
SELECT 
    'FOREIGN KEY RELATIONSHIPS TEST REPORT' as "Title";
SELECT 
    '=================================================================' as "Separator";

-- Total count summary
SELECT 
    COUNT(*) as "Total Foreign Keys",
    COUNT(*) FILTER (WHERE status = 'OK') as "Valid FKs",
    COUNT(*) FILTER (WHERE status = 'ORPHANED') as "FKs with Orphaned Records",
    COUNT(*) FILTER (WHERE status = 'ERROR') as "FKs with Errors"
FROM fk_test_results;

SELECT '' as " ";

SELECT 
    '=================================================================' as "Separator";
SELECT 
    'DETAILED RESULTS' as "Section";
SELECT 
    '=================================================================' as "Separator";

-- Detailed results
SELECT 
    constraint_name as "Constraint Name",
    table_name as "Table",
    column_name as "Column",
    referenced_table_name as "References Table",
    referenced_column_name as "References Column",
    status as "Status",
    CASE 
        WHEN orphaned_count > 0 THEN orphaned_count::TEXT
        ELSE '-'
    END as "Orphaned Records",
    COALESCE(error_message, '-') as "Error/Notes"
FROM fk_test_results
ORDER BY status DESC, table_name, constraint_name;

SELECT '' as " ";

SELECT 
    '=================================================================' as "Separator";
SELECT 
    'ORPHANED RECORDS SUMMARY' as "Section";
SELECT 
    '=================================================================' as "Separator";

-- Summary of orphaned records
SELECT 
    table_name as "Table",
    column_name as "Column",
    referenced_table_name as "References Table",
    orphaned_count as "Orphaned Count"
FROM fk_test_results
WHERE orphaned_count > 0
ORDER BY orphaned_count DESC, table_name;

SELECT '' as " ";

SELECT 
    '=================================================================' as "Separator";
SELECT 
    'ERRORS SUMMARY' as "Section";
SELECT 
    '=================================================================' as "Separator";

-- Summary of errors
SELECT 
    constraint_name as "Constraint Name",
    table_name as "Table",
    column_name as "Column",
    error_message as "Error Message"
FROM fk_test_results
WHERE status = 'ERROR'
ORDER BY table_name, constraint_name;

SELECT '' as " ";

SELECT 
    '=================================================================' as "Separator";
SELECT 
    'QUERIES TO FIX ORPHANED RECORDS (if any found)' as "Section";
SELECT 
    '=================================================================' as "Separator";

-- Generate queries to identify orphaned records
SELECT 
    format(
        '-- Orphaned records in %I.%I.%I referencing %I.%I.%I',
        table_schema, table_name, column_name,
        referenced_table_schema, referenced_table_name, referenced_column_name
    ) as "Query"
FROM fk_test_results
WHERE orphaned_count > 0

UNION ALL

SELECT 
    format(
        'SELECT * FROM %I.%I t1 WHERE t1.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I.%I t2 WHERE t2.%I = t1.%I);',
        table_schema, table_name, column_name,
        referenced_table_schema, referenced_table_name, referenced_column_name, column_name
    ) as "Query"
FROM fk_test_results
WHERE orphaned_count > 0

ORDER BY "Query";

SELECT '' as " ";

SELECT 
    '=================================================================' as "Separator";
SELECT 
    'Test completed.' as "Status";
SELECT 
    '=================================================================' as "Separator";

