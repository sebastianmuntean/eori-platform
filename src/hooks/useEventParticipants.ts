'use client';

import { useState, useCallback } from 'react';

export type ParticipantRole = 'bride' | 'groom' | 'baptized' | 'deceased' | 'godparent' | 'witness' | 'parent' | 'other';

export interface EventParticipant {
  id: string;
  eventId: string;
  parishionerId: string | null;
  role: ParticipantRole;
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  cnp: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseEventParticipantsReturn {
  participants: EventParticipant[];
  loading: boolean;
  error: string | null;
  fetchParticipants: (eventId: string) => Promise<void>;
  createParticipant: (eventId: string, participantData: {
    parishionerId?: string | null;
    role: ParticipantRole;
    firstName: string;
    lastName?: string | null;
    birthDate?: string | null;
    cnp?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  }) => Promise<EventParticipant | null>;
  updateParticipant: (eventId: string, participantId: string, participantData: Partial<EventParticipant>) => Promise<EventParticipant | null>;
  deleteParticipant: (eventId: string, participantId: string) => Promise<boolean>;
}

export function useEventParticipants(): UseEventParticipantsReturn {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch participants');
      }

      setParticipants(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch participants';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createParticipant = useCallback(async (
    eventId: string,
    participantData: Partial<EventParticipant>
  ): Promise<EventParticipant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create participant');
      }

      setParticipants((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create participant';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParticipant = useCallback(async (
    eventId: string,
    participantId: string,
    participantData: Partial<EventParticipant>
  ): Promise<EventParticipant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update participant');
      }

      setParticipants((prev) => prev.map((p) => (p.id === participantId ? result.data : p)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update participant';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteParticipant = useCallback(async (
    eventId: string,
    participantId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete participant');
      }

      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete participant';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    createParticipant,
    updateParticipant,
    deleteParticipant,
  };
}

