-- Migration: Add Cemeteries permissions
-- This migration adds all permissions for the Cemeteries module

-- Note: This migration uses ON CONFLICT DO NOTHING to be idempotent
-- If permissions already exist, they will be skipped

-- ============================================
-- CEMETERIES MODULE PERMISSIONS
-- ============================================

-- Cemetery CRUD
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.create', 'Create Cemeteries', 'Create cemeteries', 'cemeteries', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.read', 'Read Cemeteries', 'Read/view cemeteries', 'cemeteries', 'read')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.update', 'Update Cemeteries', 'Update cemeteries', 'cemeteries', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.delete', 'Delete Cemeteries', 'Delete cemeteries', 'cemeteries', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Parcels
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.parcels.create', 'Create Parcels', 'Create cemetery parcels', 'cemeteries.parcels', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.parcels.update', 'Update Parcels', 'Update cemetery parcels', 'cemeteries.parcels', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.parcels.delete', 'Delete Parcels', 'Delete cemetery parcels', 'cemeteries.parcels', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Rows
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.rows.create', 'Create Rows', 'Create cemetery rows', 'cemeteries.rows', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.rows.update', 'Update Rows', 'Update cemetery rows', 'cemeteries.rows', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.rows.delete', 'Delete Rows', 'Delete cemetery rows', 'cemeteries.rows', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Graves
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.graves.create', 'Create Graves', 'Create cemetery graves', 'cemeteries.graves', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.graves.update', 'Update Graves', 'Update cemetery graves', 'cemeteries.graves', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.graves.delete', 'Delete Graves', 'Delete cemetery graves', 'cemeteries.graves', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Burials
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.burials.create', 'Create Burials', 'Create burials', 'cemeteries.burials', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.burials.update', 'Update Burials', 'Update burials', 'cemeteries.burials', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.burials.delete', 'Delete Burials', 'Delete burials', 'cemeteries.burials', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Concessions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.create', 'Create Concessions', 'Create cemetery concessions', 'cemeteries.concessions', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.update', 'Update Concessions', 'Update cemetery concessions', 'cemeteries.concessions', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.delete', 'Delete Concessions', 'Delete cemetery concessions', 'cemeteries.concessions', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Concession Payments
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.payments.create', 'Create Concession Payments', 'Create concession payments', 'cemeteries.concessions.payments', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.payments.update', 'Update Concession Payments', 'Update concession payments', 'cemeteries.concessions.payments', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('cemeteries.concessions.payments.delete', 'Delete Concession Payments', 'Delete concession payments', 'cemeteries.concessions.payments', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

