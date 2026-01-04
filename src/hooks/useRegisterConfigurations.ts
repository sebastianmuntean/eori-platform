'use client';

import { useState, useCallback } from 'react';

export interface RegisterConfiguration {
  id: string;
  name: string;
  parishId: string | null;
  resetsAnnually: boolean;
  startingNumber: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  parish?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface UseRegisterConfigurationsReturn {
  registerConfigurations: RegisterConfiguration[];
  loading: boolean;
  error: string | null;
  fetchRegisterConfigurations: (params?: { parishId?: string }) => Promise<void>;
}

interface UseRegisterConfigurationReturn {
  registerConfiguration: RegisterConfiguration | null;
  loading: boolean;
  error: string | null;
  fetchRegisterConfiguration: (id: string) => Promise<void>;
}

interface UseCreateRegisterConfigurationReturn {
  createRegisterConfiguration: (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually?: boolean;
    startingNumber?: number;
    notes?: string | null;
  }) => Promise<RegisterConfiguration | null>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateRegisterConfigurationReturn {
  updateRegisterConfiguration: (id: string, data: {
    name?: string;
    parishId?: string | null;
    resetsAnnually?: boolean;
    startingNumber?: number;
    notes?: string | null;
  }) => Promise<RegisterConfiguration | null>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteRegisterConfigurationReturn {
  deleteRegisterConfiguration: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

interface UseCreateRegistersForParishesReturn {
  createRegistersForParishes: () => Promise<{
    created: number;
    registers: Array<{
      id: string;
      name: string;
      parishId: string;
      parishName: string;
      parishCode: string;
    }>;
  } | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching list of register configurations
 */
export function useRegisterConfigurations(): UseRegisterConfigurationsReturn {
  const [registerConfigurations, setRegisterConfigurations] = useState<RegisterConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegisterConfigurations = useCallback(async (params?: { parishId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.parishId) {
        searchParams.append('parishId', params.parishId);
      }

      const url = `/api/registratura/register-configurations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch register configurations');
      }

      if (result.success) {
        setRegisterConfigurations(result.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch register configurations';
      setError(errorMessage);
      console.error('Error fetching register configurations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registerConfigurations,
    loading,
    error,
    fetchRegisterConfigurations,
  };
}

/**
 * Hook for fetching a single register configuration
 */
export function useRegisterConfiguration(id?: string): UseRegisterConfigurationReturn {
  const [registerConfiguration, setRegisterConfiguration] = useState<RegisterConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegisterConfiguration = useCallback(async (configId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/register-configurations/${configId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch register configuration');
      }

      if (result.success) {
        setRegisterConfiguration(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch register configuration';
      setError(errorMessage);
      console.error('Error fetching register configuration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registerConfiguration,
    loading,
    error,
    fetchRegisterConfiguration,
  };
}

/**
 * Hook for creating a register configuration
 */
export function useCreateRegisterConfiguration(): UseCreateRegisterConfigurationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRegisterConfiguration = useCallback(async (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually?: boolean;
    startingNumber?: number;
    notes?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/registratura/register-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create register configuration');
      }

      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create register configuration';
      setError(errorMessage);
      console.error('Error creating register configuration:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createRegisterConfiguration,
    loading,
    error,
  };
}

/**
 * Hook for updating a register configuration
 */
export function useUpdateRegisterConfiguration(): UseUpdateRegisterConfigurationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRegisterConfiguration = useCallback(async (id: string, data: {
    name?: string;
    parishId?: string | null;
    resetsAnnually?: boolean;
    startingNumber?: number;
    notes?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/register-configurations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update register configuration');
      }

      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update register configuration';
      setError(errorMessage);
      console.error('Error updating register configuration:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateRegisterConfiguration,
    loading,
    error,
  };
}

/**
 * Hook for deleting a register configuration
 */
export function useDeleteRegisterConfiguration(): UseDeleteRegisterConfigurationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRegisterConfiguration = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/register-configurations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete register configuration');
      }

      return result.success === true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete register configuration';
      setError(errorMessage);
      console.error('Error deleting register configuration:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteRegisterConfiguration,
    loading,
    error,
  };
}

/**
 * Hook for creating register configurations for all parishes that don't have one
 */
export function useCreateRegistersForParishes(): UseCreateRegistersForParishesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRegistersForParishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/registratura/register-configurations/create-for-parishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create registers for parishes');
      }

      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create registers for parishes';
      setError(errorMessage);
      console.error('Error creating registers for parishes:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createRegistersForParishes,
    loading,
    error,
  };
}

