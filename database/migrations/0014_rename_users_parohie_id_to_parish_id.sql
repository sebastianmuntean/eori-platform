-- Migration to rename parohie_id to parish_id in users table
-- This aligns the database column name with the schema definition

DO $$ 
BEGIN
    -- Check if parohie_id exists and parish_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'parohie_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'parish_id'
    ) THEN
        -- Drop the old foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'users' 
            AND constraint_name = 'users_parohie_id_parishes_id_fk'
        ) THEN
            ALTER TABLE "users" DROP CONSTRAINT "users_parohie_id_parishes_id_fk";
        END IF;
        
        -- Rename the column
        ALTER TABLE "users" RENAME COLUMN "parohie_id" TO "parish_id";
        
        -- Recreate the foreign key constraint with the new column name
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_parish_id_parishes_id_fk" 
        FOREIGN KEY ("parish_id") 
        REFERENCES "parishes"("id") 
        ON DELETE SET NULL 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'Column parohie_id renamed to parish_id successfully';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'parish_id'
    ) THEN
        RAISE NOTICE 'Column parish_id already exists, skipping migration';
    ELSE
        RAISE NOTICE 'Column parohie_id does not exist, skipping migration';
    END IF;
END $$;



