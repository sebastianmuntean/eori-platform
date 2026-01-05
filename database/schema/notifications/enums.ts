import { pgEnum } from 'drizzle-orm/pg-core';

// Notification type enum: info, warning, error, success
export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'warning',
  'error',
  'success',
]);


