'use client';

import { useState, useCallback } from 'react';

export interface TrainingCourse {
  id: string;
  parishId: string | null;
  code: string;
  name: string;
  description: string | null;
  provider: string | null;
  durationHours: number | null;
  cost: string | null;
  isCertified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseTrainingCoursesReturn {
  trainingCourses: TrainingCourse[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchTrainingCourses: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createTrainingCourse: (data: Partial<TrainingCourse>) => Promise<TrainingCourse | null>;
  updateTrainingCourse: (id: string, data: Partial<TrainingCourse>) => Promise<TrainingCourse | null>;
  deleteTrainingCourse: (id: string) => Promise<boolean>;
}

export function useTrainingCourses(): UseTrainingCoursesReturn {
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseTrainingCoursesReturn['pagination']>(null);

  const fetchTrainingCourses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/training-courses?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch training courses');
      }

      setTrainingCourses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch training courses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrainingCourse = useCallback(async (data: Partial<TrainingCourse>): Promise<TrainingCourse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/training-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create training course');
      }

      await fetchTrainingCourses();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create training course';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTrainingCourses]);

  const updateTrainingCourse = useCallback(async (id: string, data: Partial<TrainingCourse>): Promise<TrainingCourse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/training-courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update training course');
      }

      await fetchTrainingCourses();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update training course';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTrainingCourses]);

  const deleteTrainingCourse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/training-courses/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete training course');
      }

      await fetchTrainingCourses();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete training course';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTrainingCourses]);

  return {
    trainingCourses,
    loading,
    error,
    pagination,
    fetchTrainingCourses,
    createTrainingCourse,
    updateTrainingCourse,
    deleteTrainingCourse,
  };
}



