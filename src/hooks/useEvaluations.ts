'use client';

import { useState, useCallback } from 'react';

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  evaluationPeriodStart: string;
  evaluationPeriodEnd: string;
  evaluationDate: string;
  overallScore: string | null;
  overallComment: string | null;
  strengths: string | null;
  improvementAreas: string | null;
  status: 'draft' | 'completed' | 'acknowledged';
  acknowledgedAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

interface UseEvaluationsReturn {
  evaluations: Evaluation[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchEvaluations: (params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    evaluatorId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createEvaluation: (data: Partial<Evaluation>) => Promise<Evaluation | null>;
  updateEvaluation: (id: string, data: Partial<Evaluation>) => Promise<Evaluation | null>;
  deleteEvaluation: (id: string) => Promise<boolean>;
  acknowledgeEvaluation: (id: string) => Promise<boolean>;
}

export function useEvaluations(): UseEvaluationsReturn {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEvaluationsReturn['pagination']>(null);

  const fetchEvaluations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.evaluatorId) queryParams.append('evaluatorId', params.evaluatorId);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/evaluations?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch evaluations');
      }

      setEvaluations(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvaluation = useCallback(async (data: Partial<Evaluation>): Promise<Evaluation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create evaluation');
      }

      await fetchEvaluations();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create evaluation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEvaluations]);

  const updateEvaluation = useCallback(async (id: string, data: Partial<Evaluation>): Promise<Evaluation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/evaluations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update evaluation');
      }

      await fetchEvaluations();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update evaluation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEvaluations]);

  const deleteEvaluation = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/evaluations/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete evaluation');
      }

      await fetchEvaluations();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete evaluation';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEvaluations]);

  const acknowledgeEvaluation = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/evaluations/${id}/acknowledge`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to acknowledge evaluation');
      }

      await fetchEvaluations();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge evaluation';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEvaluations]);

  return {
    evaluations,
    loading,
    error,
    pagination,
    fetchEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    acknowledgeEvaluation,
  };
}



