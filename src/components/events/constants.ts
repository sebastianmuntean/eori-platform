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

