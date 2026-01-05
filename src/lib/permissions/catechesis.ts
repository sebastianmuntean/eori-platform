/**
 * Catechesis module permission constants
 * 
 * These permissions follow the pattern: catechesis.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const CATECHESIS_PERMISSIONS = {
  // Classes
  CLASSES_VIEW: 'catechesis.classes.view',
  CLASSES_CREATE: 'catechesis.classes.create',
  CLASSES_UPDATE: 'catechesis.classes.update',
  CLASSES_DELETE: 'catechesis.classes.delete',

  // Lessons
  LESSONS_VIEW: 'catechesis.lessons.view',
  LESSONS_CREATE: 'catechesis.lessons.create',
  LESSONS_UPDATE: 'catechesis.lessons.update',
  LESSONS_DELETE: 'catechesis.lessons.delete',

  // Students
  STUDENTS_VIEW: 'catechesis.students.view',
  STUDENTS_CREATE: 'catechesis.students.create',
  STUDENTS_UPDATE: 'catechesis.students.update',
  STUDENTS_DELETE: 'catechesis.students.delete',

  // Enrollments
  ENROLLMENTS_VIEW: 'catechesis.enrollments.view',
  ENROLLMENTS_CREATE: 'catechesis.enrollments.create',
  ENROLLMENTS_UPDATE: 'catechesis.enrollments.update',
  ENROLLMENTS_DELETE: 'catechesis.enrollments.delete',

  // Progress
  PROGRESS_VIEW: 'catechesis.progress.view',
  PROGRESS_TRACK: 'catechesis.progress.track',
} as const;

export type CatechesisPermission = typeof CATECHESIS_PERMISSIONS[keyof typeof CATECHESIS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Catechesis permission
 */
export function isCatechesisPermission(permission: string): permission is CatechesisPermission {
  return Object.values(CATECHESIS_PERMISSIONS).includes(permission as CatechesisPermission);
}

/**
 * Get all Catechesis permissions as an array
 */
export function getAllCatechesisPermissions(): CatechesisPermission[] {
  return Object.values(CATECHESIS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const CATECHESIS_PERMISSION_GROUPS = {
  classes: [
    CATECHESIS_PERMISSIONS.CLASSES_VIEW,
    CATECHESIS_PERMISSIONS.CLASSES_CREATE,
    CATECHESIS_PERMISSIONS.CLASSES_UPDATE,
    CATECHESIS_PERMISSIONS.CLASSES_DELETE,
  ],
  lessons: [
    CATECHESIS_PERMISSIONS.LESSONS_VIEW,
    CATECHESIS_PERMISSIONS.LESSONS_CREATE,
    CATECHESIS_PERMISSIONS.LESSONS_UPDATE,
    CATECHESIS_PERMISSIONS.LESSONS_DELETE,
  ],
  students: [
    CATECHESIS_PERMISSIONS.STUDENTS_VIEW,
    CATECHESIS_PERMISSIONS.STUDENTS_CREATE,
    CATECHESIS_PERMISSIONS.STUDENTS_UPDATE,
    CATECHESIS_PERMISSIONS.STUDENTS_DELETE,
  ],
  enrollments: [
    CATECHESIS_PERMISSIONS.ENROLLMENTS_VIEW,
    CATECHESIS_PERMISSIONS.ENROLLMENTS_CREATE,
    CATECHESIS_PERMISSIONS.ENROLLMENTS_UPDATE,
    CATECHESIS_PERMISSIONS.ENROLLMENTS_DELETE,
  ],
  progress: [
    CATECHESIS_PERMISSIONS.PROGRESS_VIEW,
    CATECHESIS_PERMISSIONS.PROGRESS_TRACK,
  ],
} as const;

