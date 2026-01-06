'use client';

import { useState, useCallback } from 'react';
import { ChurchEvent, EventType } from './useEvents';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  status: string;
  location: string | null;
  parishId: string;
}

interface UseEventCalendarReturn {
  calendarEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  fetchCalendarEvents: (params?: {
    startDate?: string;
    endDate?: string;
    parishId?: string;
    type?: EventType;
    status?: string;
  }) => Promise<void>;
}

export function useEventCalendar(): UseEventCalendarReturn {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarEvents = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    parishId?: string;
    type?: EventType;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`/api/events/calendar?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch calendar events');
      }

      // Transform events to calendar format
      const transformed: CalendarEvent[] = result.data.map((event: ChurchEvent) => ({
        id: event.id,
        title: `${event.type} - ${event.location || 'TBA'}`,
        date: event.eventDate || '',
        type: event.type,
        status: event.status,
        location: event.location,
        parishId: event.parishId,
      }));

      setCalendarEvents(transformed);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendar events';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calendarEvents,
    loading,
    error,
    fetchCalendarEvents,
  };
}

