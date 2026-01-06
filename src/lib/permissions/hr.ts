/**
 * HR module permission constants
 * 
 * These permissions follow the pattern: hr.{resource}.{action}
 * All permissions are defined in the database migration 0049_add_hr_permissions.sql
 */

export const HR_PERMISSIONS = {
  // Employees
  EMPLOYEES_VIEW: 'hr.employees.view',
  EMPLOYEES_CREATE: 'hr.employees.create',
  EMPLOYEES_UPDATE: 'hr.employees.update',
  EMPLOYEES_DELETE: 'hr.employees.delete',

  // Positions
  POSITIONS_VIEW: 'hr.positions.view',
  POSITIONS_CREATE: 'hr.positions.create',
  POSITIONS_UPDATE: 'hr.positions.update',
  POSITIONS_DELETE: 'hr.positions.delete',

  // Employment Contracts
  CONTRACTS_VIEW: 'hr.contracts.view',
  CONTRACTS_CREATE: 'hr.contracts.create',
  CONTRACTS_UPDATE: 'hr.contracts.update',
  CONTRACTS_DELETE: 'hr.contracts.delete',
  CONTRACTS_RENEW: 'hr.contracts.renew',
  CONTRACTS_TERMINATE: 'hr.contracts.terminate',

  // Salaries
  SALARIES_VIEW: 'hr.salaries.view',
  SALARIES_CREATE: 'hr.salaries.create',
  SALARIES_UPDATE: 'hr.salaries.update',
  SALARIES_DELETE: 'hr.salaries.delete',
  SALARIES_CALCULATE: 'hr.salaries.calculate',
  SALARIES_APPROVE: 'hr.salaries.approve',
  SALARIES_PAY: 'hr.salaries.pay',

  // Time Entries
  TIME_ENTRIES_VIEW: 'hr.timeEntries.view',
  TIME_ENTRIES_CREATE: 'hr.timeEntries.create',
  TIME_ENTRIES_UPDATE: 'hr.timeEntries.update',
  TIME_ENTRIES_DELETE: 'hr.timeEntries.delete',
  TIME_ENTRIES_APPROVE: 'hr.timeEntries.approve',

  // Leave Types
  LEAVE_TYPES_VIEW: 'hr.leaveTypes.view',
  LEAVE_TYPES_CREATE: 'hr.leaveTypes.create',
  LEAVE_TYPES_UPDATE: 'hr.leaveTypes.update',
  LEAVE_TYPES_DELETE: 'hr.leaveTypes.delete',

  // Leave Requests
  LEAVE_REQUESTS_VIEW: 'hr.leaveRequests.view',
  LEAVE_REQUESTS_CREATE: 'hr.leaveRequests.create',
  LEAVE_REQUESTS_UPDATE: 'hr.leaveRequests.update',
  LEAVE_REQUESTS_DELETE: 'hr.leaveRequests.delete',
  LEAVE_REQUESTS_APPROVE: 'hr.leaveRequests.approve',
  LEAVE_REQUESTS_REJECT: 'hr.leaveRequests.reject',

  // Evaluations
  EVALUATIONS_VIEW: 'hr.evaluations.view',
  EVALUATIONS_CREATE: 'hr.evaluations.create',
  EVALUATIONS_UPDATE: 'hr.evaluations.update',
  EVALUATIONS_DELETE: 'hr.evaluations.delete',
  EVALUATIONS_ACKNOWLEDGE: 'hr.evaluations.acknowledge',

  // Evaluation Criteria
  EVALUATION_CRITERIA_VIEW: 'hr.evaluationCriteria.view',
  EVALUATION_CRITERIA_CREATE: 'hr.evaluationCriteria.create',
  EVALUATION_CRITERIA_UPDATE: 'hr.evaluationCriteria.update',
  EVALUATION_CRITERIA_DELETE: 'hr.evaluationCriteria.delete',

  // Training Courses
  TRAINING_COURSES_VIEW: 'hr.trainingCourses.view',
  TRAINING_COURSES_CREATE: 'hr.trainingCourses.create',
  TRAINING_COURSES_UPDATE: 'hr.trainingCourses.update',
  TRAINING_COURSES_DELETE: 'hr.trainingCourses.delete',

  // Employee Training
  EMPLOYEE_TRAINING_VIEW: 'hr.employeeTraining.view',
  EMPLOYEE_TRAINING_CREATE: 'hr.employeeTraining.create',
  EMPLOYEE_TRAINING_UPDATE: 'hr.employeeTraining.update',
  EMPLOYEE_TRAINING_DELETE: 'hr.employeeTraining.delete',
  EMPLOYEE_TRAINING_COMPLETE: 'hr.employeeTraining.complete',

  // Employee Documents
  DOCUMENTS_VIEW: 'hr.documents.view',
  DOCUMENTS_CREATE: 'hr.documents.create',
  DOCUMENTS_UPDATE: 'hr.documents.update',
  DOCUMENTS_DELETE: 'hr.documents.delete',
  DOCUMENTS_DOWNLOAD: 'hr.documents.download',

  // Reports
  REPORTS_VIEW: 'hr.reports.view',
  REPORTS_EXPORT: 'hr.reports.export',
} as const;

export type HRPermission = typeof HR_PERMISSIONS[keyof typeof HR_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid HR permission
 */
export function isHRPermission(permission: string): permission is HRPermission {
  return Object.values(HR_PERMISSIONS).includes(permission as HRPermission);
}

/**
 * Get all HR permissions as an array
 */
export function getAllHRPermissions(): HRPermission[] {
  return Object.values(HR_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const HR_PERMISSION_GROUPS = {
  employees: [
    HR_PERMISSIONS.EMPLOYEES_VIEW,
    HR_PERMISSIONS.EMPLOYEES_CREATE,
    HR_PERMISSIONS.EMPLOYEES_UPDATE,
    HR_PERMISSIONS.EMPLOYEES_DELETE,
  ],
  positions: [
    HR_PERMISSIONS.POSITIONS_VIEW,
    HR_PERMISSIONS.POSITIONS_CREATE,
    HR_PERMISSIONS.POSITIONS_UPDATE,
    HR_PERMISSIONS.POSITIONS_DELETE,
  ],
  contracts: [
    HR_PERMISSIONS.CONTRACTS_VIEW,
    HR_PERMISSIONS.CONTRACTS_CREATE,
    HR_PERMISSIONS.CONTRACTS_UPDATE,
    HR_PERMISSIONS.CONTRACTS_DELETE,
    HR_PERMISSIONS.CONTRACTS_RENEW,
    HR_PERMISSIONS.CONTRACTS_TERMINATE,
  ],
  salaries: [
    HR_PERMISSIONS.SALARIES_VIEW,
    HR_PERMISSIONS.SALARIES_CREATE,
    HR_PERMISSIONS.SALARIES_UPDATE,
    HR_PERMISSIONS.SALARIES_DELETE,
    HR_PERMISSIONS.SALARIES_CALCULATE,
    HR_PERMISSIONS.SALARIES_APPROVE,
    HR_PERMISSIONS.SALARIES_PAY,
  ],
  timeTracking: [
    HR_PERMISSIONS.TIME_ENTRIES_VIEW,
    HR_PERMISSIONS.TIME_ENTRIES_CREATE,
    HR_PERMISSIONS.TIME_ENTRIES_UPDATE,
    HR_PERMISSIONS.TIME_ENTRIES_DELETE,
    HR_PERMISSIONS.TIME_ENTRIES_APPROVE,
  ],
  leaveManagement: [
    HR_PERMISSIONS.LEAVE_TYPES_VIEW,
    HR_PERMISSIONS.LEAVE_TYPES_CREATE,
    HR_PERMISSIONS.LEAVE_TYPES_UPDATE,
    HR_PERMISSIONS.LEAVE_TYPES_DELETE,
    HR_PERMISSIONS.LEAVE_REQUESTS_VIEW,
    HR_PERMISSIONS.LEAVE_REQUESTS_CREATE,
    HR_PERMISSIONS.LEAVE_REQUESTS_UPDATE,
    HR_PERMISSIONS.LEAVE_REQUESTS_DELETE,
    HR_PERMISSIONS.LEAVE_REQUESTS_APPROVE,
    HR_PERMISSIONS.LEAVE_REQUESTS_REJECT,
  ],
  evaluations: [
    HR_PERMISSIONS.EVALUATIONS_VIEW,
    HR_PERMISSIONS.EVALUATIONS_CREATE,
    HR_PERMISSIONS.EVALUATIONS_UPDATE,
    HR_PERMISSIONS.EVALUATIONS_DELETE,
    HR_PERMISSIONS.EVALUATIONS_ACKNOWLEDGE,
    HR_PERMISSIONS.EVALUATION_CRITERIA_VIEW,
    HR_PERMISSIONS.EVALUATION_CRITERIA_CREATE,
    HR_PERMISSIONS.EVALUATION_CRITERIA_UPDATE,
    HR_PERMISSIONS.EVALUATION_CRITERIA_DELETE,
  ],
  training: [
    HR_PERMISSIONS.TRAINING_COURSES_VIEW,
    HR_PERMISSIONS.TRAINING_COURSES_CREATE,
    HR_PERMISSIONS.TRAINING_COURSES_UPDATE,
    HR_PERMISSIONS.TRAINING_COURSES_DELETE,
    HR_PERMISSIONS.EMPLOYEE_TRAINING_VIEW,
    HR_PERMISSIONS.EMPLOYEE_TRAINING_CREATE,
    HR_PERMISSIONS.EMPLOYEE_TRAINING_UPDATE,
    HR_PERMISSIONS.EMPLOYEE_TRAINING_DELETE,
    HR_PERMISSIONS.EMPLOYEE_TRAINING_COMPLETE,
  ],
  documents: [
    HR_PERMISSIONS.DOCUMENTS_VIEW,
    HR_PERMISSIONS.DOCUMENTS_CREATE,
    HR_PERMISSIONS.DOCUMENTS_UPDATE,
    HR_PERMISSIONS.DOCUMENTS_DELETE,
    HR_PERMISSIONS.DOCUMENTS_DOWNLOAD,
  ],
  reports: [
    HR_PERMISSIONS.REPORTS_VIEW,
    HR_PERMISSIONS.REPORTS_EXPORT,
  ],
} as const;






