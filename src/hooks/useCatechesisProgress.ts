'use client';

import { useState, useCallback } from 'react';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface CatechesisProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: ProgressStatus;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  timeSpentMinutes: number | null;
  score: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCatechesisProgressReturn {
  progress: CatechesisProgress[];
  loading: boolean;
  error: string | null;
  fetchProgress: (params?: {
    enrollmentId?: string;
    lessonId?: string;
  }) => Promise<void>;
  updateProgress: (progressId: string, progressData: {
    status?: ProgressStatus;
    timeSpentMinutes?: number | null;
    score?: number | null;
    notes?: string | null;
  }) => Promise<CatechesisProgress | null>;
  trackProgress: (data: {
    enrollmentId: string;
    lessonId: string;
    action: 'start' | 'complete';
    timeSpentMinutes?: number | null;
    score?: number | null;
  }) => Promise<CatechesisProgress | null>;
}

export function useCatechesisProgress(): UseCatechesisProgressReturn {
  const [progress, setProgress] = useState<CatechesisProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.enrollmentId) queryParams.append('enrollmentId', params.enrollmentId);
      if (params.lessonId) queryParams.append('lessonId', params.lessonId);

      const response = await fetch(`/api/catechesis/progress?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch progress');
      }

      setProgress(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (
    progressId: string,
    progressData: {
      status?: ProgressStatus;
      timeSpentMinutes?: number | null;
      score?: number | null;
      notes?: string | null;
    }
  ): Promise<CatechesisProgress | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/progress/${progressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress');
      }

      setProgress((prev) => prev.map((p) => (p.id === progressId ? result.data : p)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackProgress = useCallback(async (data: {
    enrollmentId: string;
    lessonId: string;
    action: 'start' | 'complete';
    timeSpentMinutes?: number | null;
    score?: number | null;
  }): Promise<CatechesisProgress | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catechesis/progress/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to track progress');
      }

      setProgress((prev) => {
        const existing = prev.find((p) => p.id === result.data.id);
        if (existing) {
          return prev.map((p) => (p.id === result.data.id ? result.data : p));
        }
        return [...prev, result.data];
      });

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track progress';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
    trackProgress,
  };
}



