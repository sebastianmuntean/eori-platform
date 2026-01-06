'use client';

import { useState, useCallback } from 'react';

export type EmailValidationMode = 'start' | 'end';
export type SubmissionFlow = 'direct' | 'review';
export type FormTargetModule = 'registratura' | 'general_register' | 'events' | 'clients';

export interface OnlineForm {
  id: string;
  parishId: string;
  parishName?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  emailValidationMode: EmailValidationMode;
  submissionFlow: SubmissionFlow;
  targetModule: FormTargetModule;
  widgetCode: string;
  successMessage: string | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

interface UseOnlineFormsReturn {
  forms: OnlineForm[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchForms: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    parishId?: string;
    targetModule?: FormTargetModule;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createForm: (data: Partial<OnlineForm>) => Promise<OnlineForm | null>;
  updateForm: (id: string, data: Partial<OnlineForm>) => Promise<OnlineForm | null>;
  deleteForm: (id: string) => Promise<boolean>;
}

interface UseOnlineFormReturn {
  form: OnlineForm | null;
  loading: boolean;
  error: string | null;
  fetchForm: (id: string) => Promise<void>;
}

/**
 * Hook for managing a list of online forms
 */
export function useOnlineForms(): UseOnlineFormsReturn {
  const [forms, setForms] = useState<OnlineForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseOnlineFormsReturn['pagination']>(null);

  const fetchForms = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    parishId?: string;
    targetModule?: FormTargetModule;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.targetModule) queryParams.append('targetModule', params.targetModule);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/online-forms?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch forms');
      }

      setForms(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch forms';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createForm = useCallback(async (data: Partial<OnlineForm>): Promise<OnlineForm | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/online-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create form');
      }

      setForms((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create form';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateForm = useCallback(async (
    id: string,
    data: Partial<OnlineForm>
  ): Promise<OnlineForm | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update form');
      }

      setForms((prev) => prev.map((form) => (form.id === id ? result.data : form)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update form';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteForm = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete form');
      }

      setForms((prev) => prev.filter((form) => form.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete form';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    forms,
    loading,
    error,
    pagination,
    fetchForms,
    createForm,
    updateForm,
    deleteForm,
  };
}

/**
 * Hook for managing a single online form
 */
export function useOnlineForm(): UseOnlineFormReturn {
  const [form, setForm] = useState<OnlineForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForm = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/online-forms/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch form');
      }

      setForm(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch form';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    form,
    loading,
    error,
    fetchForm,
  };
}




