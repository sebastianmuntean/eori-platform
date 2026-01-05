import { pgEnum } from 'drizzle-orm/pg-core';

// Gender enum
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// Employment status enum
export const employmentStatusEnum = pgEnum('employment_status', ['active', 'on_leave', 'terminated', 'retired']);

// Contract type enum
export const contractTypeEnum = pgEnum('employment_contract_type', ['indeterminate', 'determinate', 'part_time', 'internship', 'consultant']);

// Contract status enum
export const contractStatusEnum = pgEnum('employment_contract_status', ['draft', 'active', 'expired', 'terminated', 'suspended']);

// Salary status enum
export const salaryStatusEnum = pgEnum('salary_status', ['draft', 'calculated', 'approved', 'paid', 'cancelled']);

// Salary component type enum
export const salaryComponentTypeEnum = pgEnum('salary_component_type', ['base', 'bonus', 'overtime', 'allowance', 'tax', 'social_contribution', 'other']);

// Time entry status enum
export const timeEntryStatusEnum = pgEnum('time_entry_status', ['present', 'absent', 'late', 'half_day', 'holiday', 'sick_leave', 'vacation']);

// Leave request status enum
export const leaveRequestStatusEnum = pgEnum('leave_request_status', ['pending', 'approved', 'rejected', 'cancelled']);

// Evaluation status enum
export const evaluationStatusEnum = pgEnum('evaluation_status', ['draft', 'completed', 'acknowledged']);

// Employee training status enum
export const employeeTrainingStatusEnum = pgEnum('employee_training_status', ['enrolled', 'in_progress', 'completed', 'cancelled']);

// Document type enum for employee documents
export const employeeDocumentTypeEnum = pgEnum('employee_document_type', ['contract', 'id_card', 'diploma', 'certificate', 'medical', 'other']);

