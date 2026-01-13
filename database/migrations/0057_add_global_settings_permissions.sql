-- Migration: Add Global Settings permissions
-- This migration adds permissions for the Global Settings module

-- Note: This migration uses ON CONFLICT DO NOTHING to be idempotent
-- If permissions already exist, they will be skipped

-- ============================================
-- ADMINISTRATION MODULE - GLOBAL SETTINGS PERMISSIONS
-- ============================================

-- Global Settings View
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.globalSettings.view', 'View Global Settings', 'View global settings', 'administration.globalSettings', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Global Settings Update
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.globalSettings.update', 'Update Global Settings', 'Update global settings', 'administration.globalSettings', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

