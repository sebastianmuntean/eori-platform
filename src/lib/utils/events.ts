/**
 * Utility functions for event management
 * Used across funerals, baptisms, weddings, and other event types
 */

import { ChurchEvent, EventStatus, EventType } from '@/hooks/useEvents';
import { EventFormData } from '@/components/events/types';

/**
 * Format event date for display
 */
export function formatEventDate(date: string | null, locale: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale);
}

/**
 * Map ChurchEvent to EventFormData
 */
export function mapEventToFormData(event: ChurchEvent): EventFormData {
  return {
    parishId: event.parishId,
    status: event.status,
    eventDate: event.eventDate || '',
    location: event.location || '',
    priestName: event.priestName || '',
    notes: event.notes || '',
  };
}

/**
 * Get initial event form data
 */
export function getInitialEventFormData(): EventFormData {
  return {
    parishId: '',
    status: 'pending',
    eventDate: '',
    location: '',
    priestName: '',
    notes: '',
  };
}

/**
 * Build fetch parameters for events
 */
export function buildEventFetchParams(params: {
  page: number;
  pageSize: number;
  type: EventType;
  search?: string;
  parishId?: string;
  status?: EventStatus | '';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): {
  page: number;
  pageSize: number;
  type: EventType;
  search?: string;
  parishId?: string;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: string;
} {
  return {
    page: params.page,
    pageSize: params.pageSize,
    type: params.type,
    search: params.search || undefined,
    parishId: params.parishId || undefined,
    status: params.status || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    sortBy: params.sortBy || 'eventDate',
    sortOrder: params.sortOrder || 'desc',
  };
}

