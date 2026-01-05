import { pgEnum } from 'drizzle-orm/pg-core';

// Enrollment status enum
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'completed',
  'withdrawn',
]);

// Progress status enum
export const progressStatusEnum = pgEnum('progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);



