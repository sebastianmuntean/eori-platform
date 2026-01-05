'use client';

import { useState, useCallback } from 'react';

export interface CatechesisStudent {
  id: string;
  parishId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCatechesisStudentsReturn {
  students: CatechesisStudent[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchStudents: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createStudent: (studentData: Partial<CatechesisStudent>) => Promise<CatechesisStudent | null>;
  updateStudent: (studentId: string, studentData: Partial<CatechesisStudent>) => Promise<CatechesisStudent | null>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  fetchStudentEnrollments: (studentId: string) => Promise<any[]>;
  fetchStudentProgress: (studentId: string) => Promise<any[]>;
}

export function useCatechesisStudents(): UseCatechesisStudentsReturn {
  const [students, setStudents] = useState<CatechesisStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCatechesisStudentsReturn['pagination']>(null);

  const fetchStudents = useCallback(async (params = {}) => {
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

      const response = await fetch(`/api/catechesis/students?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch students');
      }

      setStudents(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStudent = useCallback(async (studentData: Partial<CatechesisStudent>): Promise<CatechesisStudent | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catechesis/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create student');
      }

      setStudents((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create student';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (
    studentId: string,
    studentData: Partial<CatechesisStudent>
  ): Promise<CatechesisStudent | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update student');
      }

      setStudents((prev) => prev.map((s) => (s.id === studentId ? result.data : s)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (studentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/students/${studentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete student');
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentEnrollments = useCallback(async (studentId: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/students/${studentId}/enrollments`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch student enrollments');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student enrollments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentProgress = useCallback(async (studentId: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/students/${studentId}/progress`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch student progress');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student progress';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    error,
    pagination,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    fetchStudentEnrollments,
    fetchStudentProgress,
  };
}



