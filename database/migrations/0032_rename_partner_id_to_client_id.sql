-- Migration to rename partner_id columns to client_id and update foreign keys
-- This aligns the database column names with the schema changes from partners to clients

DO $$ 
DECLARE
    missing_count INTEGER;
BEGIN
    -- ============================================
    -- 1. INVOICES TABLE
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'partner_id'
    ) THEN
        -- Check if there are invoices with partner_id that don't exist in clients
        SELECT COUNT(*) INTO missing_count
        FROM invoices i
        WHERE i.partner_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM clients c WHERE c.id = i.partner_id
        );

        -- If there are missing clients, we cannot proceed (invoices.partner_id is NOT NULL)
        IF missing_count > 0 THEN
            RAISE EXCEPTION 'Found % invoices with partner_id that do not exist in clients table. Cannot proceed. Please ensure all partner_ids in invoices exist in clients table first. Missing partner_ids: %', 
                missing_count,
                (SELECT array_agg(DISTINCT partner_id::text) FROM invoices WHERE partner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = invoices.partner_id));
        END IF;

        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'invoices' 
            AND constraint_name LIKE '%partner_id%'
        ) THEN
            ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "invoices" RENAME COLUMN "partner_id" TO "client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "invoices" 
        ADD CONSTRAINT "invoices_client_id_clients_id_fk" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'invoices: partner_id renamed to client_id';
    ELSIF EXISTS (
        -- Check if client_id already exists (migration might have been partially run)
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'client_id'
    ) THEN
        RAISE NOTICE 'invoices: client_id column already exists, skipping migration';
        
        -- If partner_id also exists, drop it (orphaned column)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'invoices' 
            AND column_name = 'partner_id'
        ) THEN
            -- Drop old foreign key constraint if exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'invoices' 
                AND constraint_name LIKE '%partner_id%'
            ) THEN
                ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_partner_id_partners_id_fk";
            END IF;
            
            -- Drop the orphaned partner_id column
            ALTER TABLE "invoices" DROP COLUMN IF EXISTS "partner_id";
            RAISE NOTICE 'invoices: dropped orphaned partner_id column';
        END IF;
    END IF;

    -- ============================================
    -- 2. CONTRACTS TABLE
    -- ============================================
    -- Check if partner_id column exists and client_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contracts' 
        AND column_name = 'partner_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contracts' 
        AND column_name = 'client_id'
    ) THEN
        -- Check for missing clients
        SELECT COUNT(*) INTO missing_count
        FROM contracts c
        WHERE c.partner_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM clients cl WHERE cl.id = c.partner_id
        );

        -- If there are missing clients, we cannot proceed (contracts.partner_id is NOT NULL)
        IF missing_count > 0 THEN
            RAISE EXCEPTION 'Found % contracts with partner_id that do not exist in clients table. Cannot proceed. Please ensure all partner_ids in contracts exist in clients table first. Missing partner_ids: %', 
                missing_count,
                (SELECT array_agg(DISTINCT partner_id::text) FROM contracts WHERE partner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clients cl WHERE cl.id = contracts.partner_id));
        END IF;

        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'contracts' 
            AND constraint_name LIKE '%partner_id%'
        ) THEN
            ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "contracts" RENAME COLUMN "partner_id" TO "client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "contracts" 
        ADD CONSTRAINT "contracts_client_id_clients_id_fk" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'contracts: partner_id renamed to client_id';
    ELSIF EXISTS (
        -- Check if client_id already exists (migration might have been partially run)
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contracts' 
        AND column_name = 'client_id'
    ) THEN
        RAISE NOTICE 'contracts: client_id column already exists, skipping migration';
        
        -- If partner_id also exists, drop it (orphaned column)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'contracts' 
            AND column_name = 'partner_id'
        ) THEN
            -- Drop old foreign key constraint if exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'contracts' 
                AND constraint_name LIKE '%partner_id%'
            ) THEN
                ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_partner_id_partners_id_fk";
            END IF;
            
            -- Drop the orphaned partner_id column
            ALTER TABLE "contracts" DROP COLUMN IF EXISTS "partner_id";
            RAISE NOTICE 'contracts: dropped orphaned partner_id column';
        END IF;
    END IF;

    -- ============================================
    -- 3. PAYMENTS TABLE
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'partner_id'
    ) THEN
        -- Check for missing clients (payments.partner_id is nullable, so we can set to NULL)
        SELECT COUNT(*) INTO missing_count
        FROM payments p
        WHERE p.partner_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM clients c WHERE c.id = p.partner_id
        );

        -- If there are missing clients, set to NULL (payments.partner_id is nullable)
        IF missing_count > 0 THEN
            RAISE NOTICE 'Found % payments with partner_id not in clients. Setting to NULL...', missing_count;
            UPDATE payments 
            SET partner_id = NULL 
            WHERE partner_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = payments.partner_id);
        END IF;

        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'payments' 
            AND constraint_name LIKE '%partner_id%'
        ) THEN
            ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "payments" RENAME COLUMN "partner_id" TO "client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "payments" 
        ADD CONSTRAINT "payments_client_id_clients_id_fk" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'payments: partner_id renamed to client_id';
    ELSIF EXISTS (
        -- Check if client_id already exists
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'client_id'
    ) THEN
        RAISE NOTICE 'payments: client_id column already exists, skipping migration';
        
        -- If partner_id also exists, drop it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payments' 
            AND column_name = 'partner_id'
        ) THEN
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'payments' 
                AND constraint_name LIKE '%partner_id%'
            ) THEN
                ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_partner_id_partners_id_fk";
            END IF;
            ALTER TABLE "payments" DROP COLUMN IF EXISTS "partner_id";
            RAISE NOTICE 'payments: dropped orphaned partner_id column';
        END IF;
    END IF;

    -- ============================================
    -- 4. STOCK_MOVEMENTS TABLE
    -- ============================================
    -- Check if partner_id column exists and client_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'partner_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'client_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'stock_movements' 
            AND constraint_name LIKE '%partner_id%'
        ) THEN
            ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "stock_movements" RENAME COLUMN "partner_id" TO "client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_client_id_clients_id_fk" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("id") 
        ON DELETE SET NULL 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'stock_movements: partner_id renamed to client_id';
    ELSIF EXISTS (
        -- Check if client_id already exists
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'client_id'
    ) THEN
        RAISE NOTICE 'stock_movements: client_id column already exists, skipping migration';
        
        -- If partner_id also exists, drop it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'stock_movements' 
            AND column_name = 'partner_id'
        ) THEN
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'stock_movements' 
                AND constraint_name LIKE '%partner_id%'
            ) THEN
                ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_partner_id_partners_id_fk";
            END IF;
            ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "partner_id";
            RAISE NOTICE 'stock_movements: dropped orphaned partner_id column';
        END IF;
    END IF;

    -- ============================================
    -- 5. DOCUMENT_REGISTRY TABLE (sender_partner_id, recipient_partner_id)
    -- ============================================
    -- Sender partner_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'document_registry' 
        AND column_name = 'sender_partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'document_registry' 
            AND constraint_name LIKE '%sender_partner_id%'
        ) THEN
            ALTER TABLE "document_registry" DROP CONSTRAINT IF EXISTS "document_registry_sender_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "document_registry" RENAME COLUMN "sender_partner_id" TO "sender_client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "document_registry" 
        ADD CONSTRAINT "document_registry_sender_client_id_clients_id_fk" 
        FOREIGN KEY ("sender_client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'document_registry: sender_partner_id renamed to sender_client_id';
    END IF;

    -- Recipient partner_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'document_registry' 
        AND column_name = 'recipient_partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'document_registry' 
            AND constraint_name LIKE '%recipient_partner_id%'
        ) THEN
            ALTER TABLE "document_registry" DROP CONSTRAINT IF EXISTS "document_registry_recipient_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "document_registry" RENAME COLUMN "recipient_partner_id" TO "recipient_client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "document_registry" 
        ADD CONSTRAINT "document_registry_recipient_client_id_clients_id_fk" 
        FOREIGN KEY ("recipient_client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'document_registry: recipient_partner_id renamed to recipient_client_id';
    END IF;

    -- ============================================
    -- 6. LIBRARY_LOANS TABLE (borrower_partner_id)
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'library_loans' 
        AND column_name = 'borrower_partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'library_loans' 
            AND constraint_name LIKE '%borrower_partner_id%'
        ) THEN
            ALTER TABLE "library_loans" DROP CONSTRAINT IF EXISTS "library_loans_borrower_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "library_loans" RENAME COLUMN "borrower_partner_id" TO "borrower_client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "library_loans" 
        ADD CONSTRAINT "library_loans_borrower_client_id_clients_id_fk" 
        FOREIGN KEY ("borrower_client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'library_loans: borrower_partner_id renamed to borrower_client_id';
    END IF;

    -- ============================================
    -- 7. BURIALS TABLE (deceased_partner_id)
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'burials' 
        AND column_name = 'deceased_partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'burials' 
            AND constraint_name LIKE '%deceased_partner_id%'
        ) THEN
            ALTER TABLE "burials" DROP CONSTRAINT IF EXISTS "burials_deceased_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "burials" RENAME COLUMN "deceased_partner_id" TO "deceased_client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "burials" 
        ADD CONSTRAINT "burials_deceased_client_id_clients_id_fk" 
        FOREIGN KEY ("deceased_client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'burials: deceased_partner_id renamed to deceased_client_id';
    END IF;

    -- ============================================
    -- 8. CONCESSIONS TABLE (holder_partner_id)
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'concessions' 
        AND column_name = 'holder_partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'concessions' 
            AND constraint_name LIKE '%holder_partner_id%'
        ) THEN
            ALTER TABLE "concessions" DROP CONSTRAINT IF EXISTS "concessions_holder_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "concessions" RENAME COLUMN "holder_partner_id" TO "holder_client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "concessions" 
        ADD CONSTRAINT "concessions_holder_client_id_clients_id_fk" 
        FOREIGN KEY ("holder_client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'concessions: holder_partner_id renamed to holder_client_id';
    END IF;

    -- ============================================
    -- 9. PARISHIONERS TABLE (partner_id)
    -- ============================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parishioners' 
        AND column_name = 'partner_id'
    ) THEN
        -- Drop old foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'parishioners' 
            AND constraint_name LIKE '%partner_id%'
        ) THEN
            ALTER TABLE "parishioners" DROP CONSTRAINT IF EXISTS "parishioners_partner_id_partners_id_fk";
        END IF;
        
        -- Rename column
        ALTER TABLE "parishioners" RENAME COLUMN "partner_id" TO "client_id";
        
        -- Recreate foreign key constraint pointing to clients
        ALTER TABLE "parishioners" 
        ADD CONSTRAINT "parishioners_client_id_clients_id_fk" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION;
        
        RAISE NOTICE 'parishioners: partner_id renamed to client_id';
    END IF;

    RAISE NOTICE 'Migration completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during migration: %', SQLERRM;
END $$;

