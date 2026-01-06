'use client';

import { useState, useCallback } from 'react';

export type ParticipantStatus = 'registered' | 'confirmed' | 'paid' | 'cancelled' | 'waitlisted';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface PilgrimageParticipant {
  id: string;
  pilgrimageId: string;
  parishionerId: string | null;
  firstName: string;
  lastName: string | null;
  cnp: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  specialNeeds: string | null;
  status: ParticipantStatus;
  registrationDate: Date | string;
  paymentStatus: PaymentStatus;
  totalAmount: string | null;
  paidAmount: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UsePilgrimageParticipantsReturn {
  participants: PilgrimageParticipant[];
  loading: boolean;
  error: string | null;
  fetchParticipants: (pilgrimageId: string, params?: {
    status?: ParticipantStatus;
    search?: string;
  }) => Promise<void>;
  addParticipant: (pilgrimageId: string, data: Partial<PilgrimageParticipant>) => Promise<PilgrimageParticipant | null>;
  updateParticipant: (pilgrimageId: string, participantId: string, data: Partial<PilgrimageParticipant>) => Promise<PilgrimageParticipant | null>;
  deleteParticipant: (pilgrimageId: string, participantId: string) => Promise<boolean>;
  confirmParticipant: (pilgrimageId: string, participantId: string) => Promise<boolean>;
  cancelParticipant: (pilgrimageId: string, participantId: string) => Promise<boolean>;
  exportParticipants: (pilgrimageId: string) => Promise<void>;
}

export function usePilgrimageParticipants(): UsePilgrimageParticipantsReturn {
  const [participants, setParticipants] = useState<PilgrimageParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (pilgrimageId: string, params?: {
    status?: ParticipantStatus;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants?${queryParams.toString()}`);
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

  const addParticipant = useCallback(async (
    pilgrimageId: string,
    data: Partial<PilgrimageParticipant>
  ): Promise<PilgrimageParticipant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add participant');
      }

      setParticipants((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParticipant = useCallback(async (
    pilgrimageId: string,
    participantId: string,
    data: Partial<PilgrimageParticipant>
  ): Promise<PilgrimageParticipant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/${participantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    pilgrimageId: string,
    participantId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/${participantId}`, {
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

  const confirmParticipant = useCallback(async (
    pilgrimageId: string,
    participantId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/${participantId}/confirm`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm participant');
      }

      setParticipants((prev) => prev.map((p) => (p.id === participantId ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm participant';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelParticipant = useCallback(async (
    pilgrimageId: string,
    participantId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/${participantId}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel participant');
      }

      setParticipants((prev) => prev.map((p) => (p.id === participantId ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel participant';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportParticipants = useCallback(async (pilgrimageId: string) => {
    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pilgrimage-${pilgrimageId}-participants.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export participants';
      setError(errorMessage);
    }
  }, []);

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    confirmParticipant,
    cancelParticipant,
    exportParticipants,
  };
}







