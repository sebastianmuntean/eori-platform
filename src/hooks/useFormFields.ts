'use client';

import { useState, useCallback } from 'react';

export type FormFieldType = 'text' | 'email' | 'textarea' | 'select' | 'date' | 'number' | 'file';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  formId: string;
  fieldKey: string;
  fieldType: FormFieldType;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  validationRules: Record<string, any> | null;
  options: FormFieldOption[] | null;
  orderIndex: number;
  createdAt: string;
}

interface UseFormFieldsReturn {
  fields: FormField[];
  loading: boolean;
  error: string | null;
  fetchFields: (formId: string) => Promise<void>;
  createField: (formId: string, data: Partial<FormField>) => Promise<FormField | null>;
  updateField: (formId: string, fieldId: string, data: Partial<FormField>) => Promise<FormField | null>;
  deleteField: (formId: string, fieldId: string) => Promise<boolean>;
}

/**
 * Hook for managing form fields
 */
export function useFormFields(): UseFormFieldsReturn {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async (formId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/fields`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch fields');
      }

      setFields(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fields';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createField = useCallback(async (
    formId: string,
    data: Partial<FormField>
  ): Promise<FormField | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create field');
      }

      setFields((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create field';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateField = useCallback(async (
    formId: string,
    fieldId: string,
    data: Partial<FormField>
  ): Promise<FormField | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update field');
      }

      setFields((prev) => prev.map((field) => (field.id === fieldId ? result.data : field)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update field';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteField = useCallback(async (
    formId: string,
    fieldId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete field');
      }

      setFields((prev) => prev.filter((field) => field.id !== fieldId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete field';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fields,
    loading,
    error,
    fetchFields,
    createField,
    updateField,
    deleteField,
  };
}


