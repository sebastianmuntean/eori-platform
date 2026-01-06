'use client';

import { useState, useCallback } from 'react';

export type SubmissionStatus = 'pending_validation' | 'validated' | 'processing' | 'completed' | 'rejected';

export interface FormSubmission {
  id: string;
  formId: string;
  formName?: string;
  submissionToken: string;
  status: SubmissionStatus;
  email: string | null;
  emailValidatedAt: string | null;
  formData: Record<string, any>;
  targetRecordId: string | null;
  submittedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

interface UseFormSubmissionsReturn {
  submissions: FormSubmission[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchSubmissions: (params?: {
    page?: number;
    limit?: number;
    formId?: string;
    status?: SubmissionStatus;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  processSubmission: (id: string) => Promise<boolean>;
}

interface UseFormSubmissionReturn {
  submission: FormSubmission | null;
  loading: boolean;
  error: string | null;
  fetchSubmission: (id: string) => Promise<void>;
}

/**
 * Hook for managing form submissions
 */
export function useFormSubmissions(): UseFormSubmissionsReturn {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseFormSubmissionsReturn['pagination']>(null);

  const fetchSubmissions = useCallback(async (params: {
    page?: number;
    limit?: number;
    formId?: string;
    status?: SubmissionStatus;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.formId) queryParams.append('formId', params.formId);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/online-forms/submissions?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch submissions');
      }

      setSubmissions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submissions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const processSubmission = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/submissions/${id}/process`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to process submission');
      }

      // Refresh submissions list
      await fetchSubmissions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process submission';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    pagination,
    fetchSubmissions,
    processSubmission,
  };
}

/**
 * Hook for managing a single form submission
 */
export function useFormSubmission(): UseFormSubmissionReturn {
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/submissions/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch submission');
      }

      setSubmission(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submission';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submission,
    loading,
    error,
    fetchSubmission,
  };
}







