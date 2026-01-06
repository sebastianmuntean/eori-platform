'use client';

import { useState, useCallback } from 'react';

export type EnrollmentStatus = 'active' | 'completed' | 'withdrawn';

export interface CatechesisClass {
  id: string;
  parishId: string;
  name: string;
  description: string | null;
  grade: string | null;
  teacherId: string | null;
  startDate: string | null;
  endDate: string | null;
  maxStudents: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCatechesisClassesReturn {
  classes: CatechesisClass[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchClasses: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    grade?: string;
    teacherId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createClass: (classData: Partial<CatechesisClass>) => Promise<CatechesisClass | null>;
  updateClass: (classId: string, classData: Partial<CatechesisClass>) => Promise<CatechesisClass | null>;
  deleteClass: (classId: string) => Promise<boolean>;
  fetchClassStudents: (classId: string) => Promise<any[]>;
  fetchClassLessons: (classId: string) => Promise<any[]>;
}

export function useCatechesisClasses(): UseCatechesisClassesReturn {
  const [classes, setClasses] = useState<CatechesisClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCatechesisClassesReturn['pagination']>(null);

  const fetchClasses = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    grade?: string;
    teacherId?: string;
    isActive?: boolean;
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
      if (params?.grade) queryParams.append('grade', params.grade);
      if (params?.teacherId) queryParams.append('teacherId', params.teacherId);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/catechesis/classes?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch classes');
      }

      setClasses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch classes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClass = useCallback(async (classData: Partial<CatechesisClass>): Promise<CatechesisClass | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catechesis/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create class');
      }

      setClasses((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create class';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClass = useCallback(async (
    classId: string,
    classData: Partial<CatechesisClass>
  ): Promise<CatechesisClass | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update class');
      }

      setClasses((prev) => prev.map((c) => (c.id === classId ? result.data : c)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update class';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClass = useCallback(async (classId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/classes/${classId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete class');
      }

      setClasses((prev) => prev.filter((c) => c.id !== classId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete class';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassStudents = useCallback(async (classId: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/classes/${classId}/students`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch class students');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch class students';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassLessons = useCallback(async (classId: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/classes/${classId}/lessons`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch class lessons');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch class lessons';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    classes,
    loading,
    error,
    pagination,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    fetchClassStudents,
    fetchClassLessons,
  };
}






