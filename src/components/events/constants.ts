/**
 * Shared constants for event components
 */

import { EventStatus } from '@/hooks/useEvents';

/**
 * Event status options for dropdowns
 * Used across all event types (funerals, baptisms, weddings)
 */
export const EVENT_STATUS_OPTIONS: Array<{
  value: EventStatus;
  labelKey: string;
  fallback: string;
}> = [
  { value: 'pending', labelKey: 'pending', fallback: 'În așteptare' },
  { value: 'confirmed', labelKey: 'confirmed', fallback: 'Confirmat' },
  { value: 'completed', labelKey: 'completed', fallback: 'Finalizat' },
  { value: 'cancelled', labelKey: 'cancelled', fallback: 'Anulat' },
] as const;

/**
 * Valid event status values for runtime validation
 */
export const VALID_EVENT_STATUSES: (EventStatus | '')[] = [
  '',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

/**
 * Status variant mapping for Badge components
 */
export const STATUS_VARIANT_MAP: Record<EventStatus, 'warning' | 'success' | 'danger' | 'secondary'> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'success',
  cancelled: 'danger',
};

/**
 * Default page size for event tables
 */
export const EVENT_PAGE_SIZE = 10;

/**
 * Event type constants
 */
import { EventType } from '@/hooks/useEvents';

export const EVENT_TYPES: Record<'FUNERAL' | 'BAPTISM' | 'WEDDING', EventType> = {
  FUNERAL: 'funeral',
  BAPTISM: 'baptism',
  WEDDING: 'wedding',
} as const;

