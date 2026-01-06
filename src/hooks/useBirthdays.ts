'use client';

import { useState, useCallback } from 'react';

export interface Birthday {
  id: string;
  code: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  parishId: string | null;
  upcomingBirthday: string;
  age: number;
  daysUntil: number;
}

interface UseBirthdaysReturn {
  birthdays: Birthday[];
  loading: boolean;
  error: string | null;
  fetchBirthdays: (params?: {
    dateFrom?: string;
    dateTo?: string;
    parishId?: string;
    daysAhead?: number;
  }) => Promise<void>;
}

export function useBirthdays(): UseBirthdaysReturn {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBirthdays = useCallback(async (params?: {
    dateFrom?: string;
    dateTo?: string;
    parishId?: string;
    daysAhead?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.daysAhead) queryParams.append('daysAhead', params.daysAhead.toString());

      const response = await fetch(`/api/parishioners/birthdays?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch birthdays');
      }

      setBirthdays(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch birthdays';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    birthdays,
    loading,
    error,
    fetchBirthdays,
  };
}






