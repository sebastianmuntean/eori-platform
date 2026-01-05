/**
 * Permission constants index
 * 
 * Central export point for all permission constants.
 * 
 * ## Permission String Format
 * 
 * All permissions follow the pattern: `{module}.{resource}.{action}`
 * 
 * Examples:
 * - `accounting.invoices.view`
 * - `events.baptisms.create`
 * - `parishioners.receipts.print`
 * 
 * ## Naming Conventions
 * 
 * ### Constant Names
 * 
 * - **Prefixed names**: Used for resource-specific permissions
 *   - Example: `INVOICES_VIEW`, `CLIENTS_VIEW`, `DIOCESES_VIEW`
 *   - Pattern: `{RESOURCE}_{ACTION}`
 * 
 * - **Unprefixed names**: Used for general module-level permissions
 *   - Example: `VIEW`, `CREATE`, `UPDATE` (for `events.view`, `parishioners.create`)
 *   - Used when the permission string is `{module}.{action}` (no resource level)
 *   - Modules: `events`, `parishioners`, `pilgrimages`, `analytics`, `chat`, `pangare`, `dataStatistics`, `onlineForms`
 * 
 * ### Permission Groups
 * 
 * Each module exports `*_PERMISSION_GROUPS` that organize permissions by resource
 * for easier bulk assignment and management.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { ACCOUNTING_PERMISSIONS, EVENTS_PERMISSIONS, type AllPermissions } from '@/lib/permissions';
 * 
 * // Use specific module permissions
 * const permission = ACCOUNTING_PERMISSIONS.INVOICES_VIEW;
 * 
 * // Use union type for functions accepting any permission
 * function checkPermission(permission: AllPermissions) {
 *   // ...
 * }
 * ```
 */

// Export all permission constants and types
export * from './accounting';
export * from './administration';
export * from './analytics';
export * from './catechesis';
export * from './cemeteries';
export * from './chat';
export * from './dataStatistics';
export * from './events';
export * from './hr';
export * from './onlineForms';
export * from './pangare';
export * from './parishioners';
export * from './pilgrimages';
export * from './registratura';
export * from './superadmin';

// Import permission types for union type
import type { AccountingPermission } from './accounting';
import type { AdministrationPermission } from './administration';
import type { AnalyticsPermission } from './analytics';
import type { CatechesisPermission } from './catechesis';
import type { CemeteryPermission } from './cemeteries';
import type { ChatPermission } from './chat';
import type { DataStatisticsPermission } from './dataStatistics';
import type { EventsPermission } from './events';
import type { HRPermission } from './hr';
import type { OnlineFormsPermission } from './onlineForms';
import type { PangarePermission } from './pangare';
import type { ParishionersPermission } from './parishioners';
import type { PilgrimagesPermission } from './pilgrimages';
import type { RegistraturaPermission } from './registratura';
import type { SuperadminPermission } from './superadmin';

/**
 * Union type of all permission strings across all modules.
 * 
 * Useful for functions that accept any permission or for type-safe
 * permission handling across modules.
 * 
 * @example
 * ```typescript
 * function validatePermission(permission: AllPermissions): boolean {
 *   // Type-safe permission validation
 *   return permission.includes('view');
 * }
 * ```
 */
export type AllPermissions =
  | AccountingPermission
  | AdministrationPermission
  | AnalyticsPermission
  | CatechesisPermission
  | CemeteryPermission
  | ChatPermission
  | DataStatisticsPermission
  | EventsPermission
  | HRPermission
  | OnlineFormsPermission
  | PangarePermission
  | ParishionersPermission
  | PilgrimagesPermission
  | RegistraturaPermission
  | SuperadminPermission;

