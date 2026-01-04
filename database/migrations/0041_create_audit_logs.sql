-- Migration: Create audit_logs table for comprehensive audit logging
-- This table tracks all user actions for security and compliance
-- Generated as part of Phase 1.3: Comprehensive Audit Logging

-- Create audit action enum
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'read',
  'login',
  'logout',
  'export',
  'import',
  'approve',
  'reject'
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_method VARCHAR(10),
  endpoint VARCHAR(255),
  changes JSONB, -- Before/after state for updates
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for tracking all user actions for security and compliance';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (nullable for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (create, update, delete, read, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, parish, invoice)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.changes IS 'Before/after state for update operations (JSONB)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata (JSONB)';

-- Create function to automatically clean up old audit logs (retention policy: 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add comment for the cleanup function
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Removes audit logs older than 90 days to implement retention policy';

