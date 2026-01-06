'use client';

import { useState, useCallback } from 'react';

export type EnrollmentStatus = 'active' | 'completed' | 'withdrawn';

export interface CatechesisEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: Date | string;
  status: EnrollmentStatus;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCatechesisEnrollmentsReturn {
  enrollments: CatechesisEnrollment[];
  loading: boolean;
  error: string | null;
  fetchEnrollments: (params?: {
    classId?: string;
    studentId?: string;
  }) => Promise<void>;
  createEnrollment: (enrollmentData: {
    classId: string;
    studentId: string;
    status?: EnrollmentStatus;
    notes?: string | null;
  }) => Promise<CatechesisEnrollment | null>;
  updateEnrollment: (enrollmentId: string, enrollmentData: {
    status?: EnrollmentStatus;
    notes?: string | null;
  }) => Promise<CatechesisEnrollment | null>;
  deleteEnrollment: (enrollmentId: string) => Promise<boolean>;
}

export function useCatechesisEnrollments(): UseCatechesisEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<CatechesisEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (params?: {
    classId?: string;
    studentId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.classId) queryParams.append('classId', params.classId);
      if (params?.studentId) queryParams.append('studentId', params.studentId);

      const response = await fetch(`/api/catechesis/enrollments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch enrollments');
      }

      setEnrollments(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEnrollment = useCallback(async (enrollmentData: {
    classId: string;
    studentId: string;
    status?: EnrollmentStatus;
    notes?: string | null;
  }): Promise<CatechesisEnrollment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catechesis/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create enrollment');
      }

      setEnrollments((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create enrollment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEnrollment = useCallback(async (
    enrollmentId: string,
    enrollmentData: {
      status?: EnrollmentStatus;
      notes?: string | null;
    }
  ): Promise<CatechesisEnrollment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update enrollment');
      }

      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? result.data : e)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update enrollment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEnrollment = useCallback(async (enrollmentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catechesis/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete enrollment');
      }

      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete enrollment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
  };
}






