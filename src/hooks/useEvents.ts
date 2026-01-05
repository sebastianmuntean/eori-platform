'use client';

import { useState, useCallback } from 'react';

export type EventType = 'wedding' | 'baptism' | 'funeral';
export type EventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ChurchEvent {
  id: string;
  parishId: string;
  type: EventType;
  status: EventStatus;
  eventDate: string | null;
  location: string | null;
  priestName: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy: string | null;
}

export interface EventsResponse {
  data: ChurchEvent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseEventsReturn {
  events: ChurchEvent[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchEvents: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: EventType;
    status?: EventStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createEvent: (eventData: {
    parishId: string;
    type: EventType;
    status?: EventStatus;
    eventDate?: string | null;
    location?: string | null;
    priestName?: string | null;
    notes?: string | null;
  }) => Promise<ChurchEvent | null>;
  updateEvent: (eventId: string, eventData: {
    parishId?: string;
    type?: EventType;
    status?: EventStatus;
    eventDate?: string | null;
    location?: string | null;
    priestName?: string | null;
    notes?: string | null;
  }) => Promise<ChurchEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  confirmEvent: (eventId: string) => Promise<boolean>;
  cancelEvent: (eventId: string) => Promise<boolean>;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEventsReturn['pagination']>(null);

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/events?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch events');
      }

      setEvents(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData): Promise<ChurchEvent | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create event');
      }

      setEvents((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEvent = useCallback(async (
    eventId: string,
    eventData: Partial<ChurchEvent>
  ): Promise<ChurchEvent | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update event');
      }

      setEvents((prev) => prev.map((event) => (event.id === eventId ? result.data : event)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event');
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmEvent = useCallback(async (eventId: string): Promise<boolean> => {
    return updateEvent(eventId, { status: 'confirmed' }).then((result) => result !== null);
  }, [updateEvent]);

  const cancelEvent = useCallback(async (eventId: string): Promise<boolean> => {
    return updateEvent(eventId, { status: 'cancelled' }).then((result) => result !== null);
  }, [updateEvent]);

  return {
    events,
    loading,
    error,
    pagination,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    confirmEvent,
    cancelEvent,
  };
}

