# Database Migrations

## Important: Manual Migration Execution

**All database migrations must be run manually by the user.**

Migrations are SQL scripts located in this directory and follow the naming pattern:
- `000X_description.sql`

## Workflow

1. **Generate Migration**: After modifying schema files in `database/schema/`, run:
   ```bash
   npm run db:generate
   ```

2. **Review Migration**: Check the generated SQL file in `database/migrations/`

3. **Run Migration Manually**: Execute the SQL script using your PostgreSQL client:
   - Using psql: `psql $DATABASE_URL -f database/migrations/000X_description.sql`
   - Using pgAdmin or another GUI tool
   - Using a database management tool

4. **Verify**: Confirm the migration was applied successfully

## Migration Files (MUST BE RUN IN ORDER)

**⚠️ CRITICAL: Migrations must be executed in numerical order. Later migrations depend on tables created by earlier ones.**

1. `0000_classy_tattoo.sql` - Initial schema (users, sessions)
2. `0001_superb_adam_destine.sql` - RBAC tables (roles, permissions)  
3. `0001_uneven_plazm.sql` - Alternative/duplicate RBAC migration (check if already applied)
4. `0002_cool_wrecking_crew.sql` - Email templates
5. `0003_tan_sunset_bain.sql` - (review before applying)
6. `0004_fixed_steve_rogers.sql` - Users phone column
7. `0005_marvelous_pride.sql` - **MAJOR: Creates core tables (dioceses, deaneries, parishes, partners, etc.)** ⚠️
8. `0006_restore_users_columns.sql` - Restore address, city, phone columns
9. `0007_add_protopopi_italia.sql` - (review before applying)
10. `0008_add_departments.sql` - Departments table (requires parishes)
11. `0009_fix_dioceses_fk_cascade.sql` - Fix foreign key cascades
12. `0010_add_general_register.sql` - General register (requires parishes)
13. `0011_add_payments.sql` - Payments table (requires parishes, partners, users) ⚠️
14. `0012_add_invoices.sql` - Invoices table (requires parishes, partners, users) ⚠️
15. `0013_add_church_events.sql` - Church events (requires parishes)

**Key Dependencies:**
- `0011_add_payments.sql` and `0012_add_invoices.sql` require `0005_marvelous_pride.sql` (creates parishes, partners)
- `0008_add_departments.sql` requires `0005_marvelous_pride.sql` (creates parishes)
- Most migrations after 0005 require tables created in 0005

## Notes

- **DO NOT** use `drizzle-kit push` to apply migrations automatically
- Always backup your database before running migrations
- Test migrations on development/staging first
- Review SQL scripts before execution


