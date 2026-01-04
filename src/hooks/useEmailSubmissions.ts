'use client';

import { useState, useCallback } from 'react';

export type EmailSubmissionStatus = 'pending' | 'processed' | 'error';

export interface EmailSubmission {
  id: string;
  eventId: string | null;
  fromEmail: string;
  subject: string | null;
  content: string;
  status: EmailSubmissionStatus;
  errorMessage: string | null;
  processedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EmailSubmissionsResponse {
  data: EmailSubmission[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseEmailSubmissionsReturn {
  submissions: EmailSubmission[];
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
    pageSize?: number;
    search?: string;
    status?: EmailSubmissionStatus;
  }) => Promise<void>;
  processSubmission: (id: string) => Promise<{ emailSubmission: EmailSubmission; event?: any } | null>;
  triggerEmailFetcher: () => Promise<{ processed: number; created: number; errors: number } | null>;
}

export function useEmailSubmissions(): UseEmailSubmissionsReturn {
  const [submissions, setSubmissions] = useState<EmailSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEmailSubmissionsReturn['pagination']>(null);

  const fetchSubmissions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(`/api/events/email-submissions?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch email submissions');
      }

      setSubmissions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email submissions';
      setError(errorMessage);
      setSubmissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const processSubmission = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/email-submissions/${id}/process`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to process email submission');
      }

      // Refresh submissions list
      await fetchSubmissions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process email submission';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSubmissions]);

  const triggerEmailFetcher = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events/email-fetcher/trigger', {
        method: 'POST',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger email fetcher');
      }

      // Refresh submissions list
      await fetchSubmissions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger email fetcher';
      setError(errorMessage);
      return null;
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
    triggerEmailFetcher,
  };
}



