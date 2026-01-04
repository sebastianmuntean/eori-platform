import { useState, useCallback } from 'react';

export interface MappingDataset {
  id: string;
  name: string;
  description?: string | null;
  targetModule: 'registratura' | 'general_register' | 'events' | 'partners';
  parishId?: string | null;
  parishName?: string | null;
  isDefault: boolean;
  mappings: Array<{
    fieldKey: string;
    targetTable: string;
    targetColumn: string;
    mappingType?: 'direct' | 'sql' | 'transformation';
    sqlQuery?: string;
    transformation?: any;
  }>;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy?: string | null;
}

interface FetchDatasetsParams {
  page?: number;
  limit?: number;
  search?: string;
  targetModule?: string;
  parishId?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useMappingDatasets() {
  const [datasets, setDatasets] = useState<MappingDataset[]>([]);
  const [dataset, setDataset] = useState<MappingDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchDatasets = useCallback(async (params: FetchDatasetsParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.search) queryParams.set('search', params.search);
      if (params.targetModule) queryParams.set('targetModule', params.targetModule);
      if (params.parishId) queryParams.set('parishId', params.parishId);

      const response = await fetch(`/api/online-forms/mapping-datasets?${queryParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch datasets');
      }

      setDatasets(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch datasets';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDataset = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/mapping-datasets/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dataset');
      }

      setDataset(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dataset';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDataset = useCallback(async (data: Partial<MappingDataset>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/online-forms/mapping-datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create dataset');
      }

      return result.data as MappingDataset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create dataset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDataset = useCallback(async (id: string, data: Partial<MappingDataset>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/mapping-datasets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update dataset');
      }

      return result.data as MappingDataset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dataset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDataset = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/mapping-datasets/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete dataset');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dataset';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyDataset = useCallback(async (datasetId: string, formId: string, replaceExisting: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/mapping-datasets/${datasetId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, replaceExisting }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply dataset');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply dataset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const testSqlQuery = useCallback(async (sqlQuery: string, targetModule: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/online-forms/mapping-datasets/test-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sqlQuery, targetModule }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'SQL query validation failed');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SQL query validation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    datasets,
    dataset,
    loading,
    error,
    pagination,
    fetchDatasets,
    fetchDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    applyDataset,
    testSqlQuery,
  };
}


