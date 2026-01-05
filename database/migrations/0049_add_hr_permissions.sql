-- Migration: Add HR module permissions
-- This migration adds all RBAC permissions for the Human Resources management module

-- Insert HR permissions
-- Employees
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employees.view', 'View Employees', 'View employees', 'hr.employees', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employees.create', 'Create Employees', 'Create employees', 'hr.employees', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employees.update', 'Update Employees', 'Update employees', 'hr.employees', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employees.delete', 'Delete Employees', 'Delete employees', 'hr.employees', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Positions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.positions.view', 'View Positions', 'View positions', 'hr.positions', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.positions.create', 'Create Positions', 'Create positions', 'hr.positions', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.positions.update', 'Update Positions', 'Update positions', 'hr.positions', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.positions.delete', 'Delete Positions', 'Delete positions', 'hr.positions', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Employment Contracts
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.view', 'View Employment Contracts', 'View employment contracts', 'hr.contracts', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.create', 'Create Employment Contracts', 'Create employment contracts', 'hr.contracts', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.update', 'Update Employment Contracts', 'Update employment contracts', 'hr.contracts', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.delete', 'Delete Employment Contracts', 'Delete employment contracts', 'hr.contracts', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.renew', 'Renew Employment Contracts', 'Renew employment contracts', 'hr.contracts', 'renew')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.contracts.terminate', 'Terminate Employment Contracts', 'Terminate employment contracts', 'hr.contracts', 'terminate')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Salaries
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.view', 'View Salaries', 'View salaries', 'hr.salaries', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.create', 'Create Salaries', 'Create salaries', 'hr.salaries', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.update', 'Update Salaries', 'Update salaries', 'hr.salaries', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.delete', 'Delete Salaries', 'Delete salaries', 'hr.salaries', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.calculate', 'Calculate Salaries', 'Calculate salaries', 'hr.salaries', 'calculate')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.approve', 'Approve Salaries', 'Approve salaries', 'hr.salaries', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.salaries.pay', 'Pay Salaries', 'Pay salaries', 'hr.salaries', 'pay')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Time Entries
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.timeEntries.view', 'View Time Entries', 'View time entries', 'hr.timeEntries', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.timeEntries.create', 'Create Time Entries', 'Create time entries', 'hr.timeEntries', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.timeEntries.update', 'Update Time Entries', 'Update time entries', 'hr.timeEntries', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.timeEntries.delete', 'Delete Time Entries', 'Delete time entries', 'hr.timeEntries', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.timeEntries.approve', 'Approve Time Entries', 'Approve time entries', 'hr.timeEntries', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Leave Types
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveTypes.view', 'View Leave Types', 'View leave types', 'hr.leaveTypes', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveTypes.create', 'Create Leave Types', 'Create leave types', 'hr.leaveTypes', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveTypes.update', 'Update Leave Types', 'Update leave types', 'hr.leaveTypes', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveTypes.delete', 'Delete Leave Types', 'Delete leave types', 'hr.leaveTypes', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Leave Requests
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.view', 'View Leave Requests', 'View leave requests', 'hr.leaveRequests', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.create', 'Create Leave Requests', 'Create leave requests', 'hr.leaveRequests', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.update', 'Update Leave Requests', 'Update leave requests', 'hr.leaveRequests', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.delete', 'Delete Leave Requests', 'Delete leave requests', 'hr.leaveRequests', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.approve', 'Approve Leave Requests', 'Approve leave requests', 'hr.leaveRequests', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.leaveRequests.reject', 'Reject Leave Requests', 'Reject leave requests', 'hr.leaveRequests', 'reject')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Evaluations
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluations.view', 'View Evaluations', 'View evaluations', 'hr.evaluations', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluations.create', 'Create Evaluations', 'Create evaluations', 'hr.evaluations', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluations.update', 'Update Evaluations', 'Update evaluations', 'hr.evaluations', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluations.delete', 'Delete Evaluations', 'Delete evaluations', 'hr.evaluations', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluations.acknowledge', 'Acknowledge Evaluations', 'Acknowledge evaluations', 'hr.evaluations', 'acknowledge')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Evaluation Criteria
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluationCriteria.view', 'View Evaluation Criteria', 'View evaluation criteria', 'hr.evaluationCriteria', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluationCriteria.create', 'Create Evaluation Criteria', 'Create evaluation criteria', 'hr.evaluationCriteria', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluationCriteria.update', 'Update Evaluation Criteria', 'Update evaluation criteria', 'hr.evaluationCriteria', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.evaluationCriteria.delete', 'Delete Evaluation Criteria', 'Delete evaluation criteria', 'hr.evaluationCriteria', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Training Courses
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.trainingCourses.view', 'View Training Courses', 'View training courses', 'hr.trainingCourses', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.trainingCourses.create', 'Create Training Courses', 'Create training courses', 'hr.trainingCourses', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.trainingCourses.update', 'Update Training Courses', 'Update training courses', 'hr.trainingCourses', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.trainingCourses.delete', 'Delete Training Courses', 'Delete training courses', 'hr.trainingCourses', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Employee Training
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employeeTraining.view', 'View Employee Training', 'View employee training', 'hr.employeeTraining', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employeeTraining.create', 'Create Employee Training', 'Create employee training', 'hr.employeeTraining', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employeeTraining.update', 'Update Employee Training', 'Update employee training', 'hr.employeeTraining', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employeeTraining.delete', 'Delete Employee Training', 'Delete employee training', 'hr.employeeTraining', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.employeeTraining.complete', 'Complete Employee Training', 'Complete employee training', 'hr.employeeTraining', 'complete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Employee Documents
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.documents.view', 'View Employee Documents', 'View employee documents', 'hr.documents', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.documents.create', 'Create Employee Documents', 'Create employee documents', 'hr.documents', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.documents.update', 'Update Employee Documents', 'Update employee documents', 'hr.documents', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.documents.delete', 'Delete Employee Documents', 'Delete employee documents', 'hr.documents', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.documents.download', 'Download Employee Documents', 'Download employee documents', 'hr.documents', 'download')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Reports
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.reports.view', 'View HR Reports', 'View HR reports', 'hr.reports', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('hr.reports.export', 'Export HR Reports', 'Export HR reports', 'hr.reports', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Assign HR permissions to superadmin role (superadmin has all permissions by default in code, but we add them explicitly for clarity)
-- Note: In practice, superadmin role bypasses permission checks, but we add these for consistency
DO $$
DECLARE
    superadmin_role_id uuid;
    permission_record record;
BEGIN
    -- Get superadmin role ID
    SELECT id INTO superadmin_role_id FROM roles WHERE name = 'superadmin' LIMIT 1;
    
    IF superadmin_role_id IS NOT NULL THEN
        -- Assign all HR permissions to superadmin
        FOR permission_record IN 
            SELECT id FROM permissions WHERE name LIKE 'hr.%'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (superadmin_role_id, permission_record.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;
--> statement-breakpoint

