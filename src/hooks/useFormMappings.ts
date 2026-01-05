'use client';

import { useState, useCallback } from 'react';

export interface FormFieldMapping {
  id: string;
  formId: string;
  fieldKey: string;
  targetTable: string;
  targetColumn: string;
  transformation: Record<string, any> | null;
  createdAt: string;
}

interface UseFormMappingsReturn {
  mappings: FormFieldMapping[];
  loading: boolean;
  error: string | null;
  fetchMappings: (formId: string) => Promise<void>;
  createMapping: (formId: string, data: Partial<FormFieldMapping>) => Promise<FormFieldMapping | null>;
  updateMapping: (formId: string, mappingId: string, data: Partial<FormFieldMapping>) => Promise<FormFieldMapping | null>;
  deleteMapping: (formId: string, mappingId: string) => Promise<boolean>;
}

/**
 * Hook for managing form field mappings
 */
export function useFormMappings(): UseFormMappingsReturn {
  const [mappings, setMappings] = useState<FormFieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = useCallback(async (formId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/mappings`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch mappings');
      }

      setMappings(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mappings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMapping = useCallback(async (
    formId: string,
    data: Partial<FormFieldMapping>
  ): Promise<FormFieldMapping | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create mapping');
      }

      setMappings((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mapping';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMapping = useCallback(async (
    formId: string,
    mappingId: string,
    data: Partial<FormFieldMapping>
  ): Promise<FormFieldMapping | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/mappings/${mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update mapping');
      }

      setMappings((prev) => prev.map((mapping) => (mapping.id === mappingId ? result.data : mapping)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mapping';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMapping = useCallback(async (
    formId: string,
    mappingId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/mappings/${mappingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete mapping');
      }

      setMappings((prev) => prev.filter((mapping) => mapping.id !== mappingId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mapping';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mappings,
    loading,
    error,
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
  };
}




