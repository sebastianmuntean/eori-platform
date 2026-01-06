'use client';

import { useState, useCallback } from 'react';

export interface CatechesisLesson {
  id: string;
  parishId: string;
  classId: string | null;
  title: string;
  description: string | null;
  content: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  isPublished: boolean;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCatechesisLessonsReturn {
  lessons: CatechesisLesson[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchLessons: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    classId?: string;
    isPublished?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createLesson: (lessonData: Partial<CatechesisLesson>) => Promise<CatechesisLesson | null>;
  updateLesson: (lessonId: string, lessonData: Partial<CatechesisLesson>) => Promise<CatechesisLesson | null>;
  deleteLesson: (lessonId: string) => Promise<boolean>;
  fetchLessonPreview: (lessonId: string) => Promise<string | null>;
  assignLessonToClass: (lessonId: string, classId: string, orderIndex?: number) => Promise<CatechesisLesson | null>;
  fetchLessonById: (lessonId: string) => Promise<CatechesisLesson | null>;
}

export function useCatechesisLessons(): UseCatechesisLessonsReturn {
  const [lessons, setLessons] = useState<CatechesisLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCatechesisLessonsReturn['pagination']>(null);

  const fetchLessons = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    classId?: string;
    isPublished?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.classId) queryParams.append('classId', params.classId);
      if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/catechesis/lessons?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lessons');
      }

      setLessons(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lessons';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLesson = useCallback(async (lessonData: Partial<CatechesisLesson>): Promise<CatechesisLesson | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catechesis/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create lesson');
      }

      setLessons((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lesson';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLesson = useCallback(async (
    lessonId: string,
    lessonData: Partial<CatechesisLesson>
  ): Promise<CatechesisLesson | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update lesson');
      }

      setLessons((prev) => prev.map((l) => (l.id === lessonId ? result.data : l)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lesson';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete lesson');
      }

      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lesson';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLessonPreview = useCallback(async (lessonId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/lessons/${lessonId}/preview`);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson preview');
      }

      const content = await response.text();
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lesson preview';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignLessonToClass = useCallback(async (
    lessonId: string,
    classId: string,
    orderIndex: number = 0
  ): Promise<CatechesisLesson | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/lessons/${lessonId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, orderIndex }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign lesson to class');
      }

      setLessons((prev) => prev.map((l) => (l.id === lessonId ? result.data : l)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign lesson to class';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLessonById = useCallback(async (lessonId: string): Promise<CatechesisLesson | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/lessons/${lessonId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lesson');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lesson';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    pagination,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    fetchLessonPreview,
    assignLessonToClass,
    fetchLessonById,
  };
}


