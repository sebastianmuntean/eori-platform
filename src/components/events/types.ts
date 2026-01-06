/**
 * Shared types for event components (funerals, baptisms, weddings)
 * All event types share the same form structure
 */

import { EventStatus } from '@/hooks/useEvents';

/**
 * Form data structure for all event types
 * Used by funerals, baptisms, and weddings
 */
export interface EventFormData {
  parishId: string;
  status: EventStatus;
  eventDate: string;
  location: string;
  priestName: string;
  notes: string;
}

// Export type aliases for backward compatibility and semantic clarity
export type { EventFormData as FuneralFormData };
export type { EventFormData as BaptismFormData };
export type { EventFormData as WeddingFormData };

