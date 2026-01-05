'use client';

import { useState, useCallback } from 'react';
import { Pilgrimage } from './usePilgrimages';

interface UsePilgrimageReturn {
  pilgrimage: Pilgrimage | null;
  loading: boolean;
  error: string | null;
  fetchPilgrimage: (id: string) => Promise<void>;
  refreshPilgrimage: () => Promise<void>;
}

export function usePilgrimage(): UsePilgrimageReturn {
  const [pilgrimage, setPilgrimage] = useState<Pilgrimage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const fetchPilgrimage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setCurrentId(id);

    try {
      const response = await fetch(`/api/pilgrimages/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pilgrimage');
      }

      setPilgrimage(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pilgrimage';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPilgrimage = useCallback(async () => {
    if (currentId) {
      await fetchPilgrimage(currentId);
    }
  }, [currentId, fetchPilgrimage]);

  return {
    pilgrimage,
    loading,
    error,
    fetchPilgrimage,
    refreshPilgrimage,
  };
}



