'use client';

import { useState, useCallback } from 'react';

export interface Client {
  id: string;
  parishId: string;
  code: string;
  name?: string; // Calculated field from companyName or firstName + lastName
  firstName: string | null;
  lastName: string | null;
  cnp: string | null;
  birthDate: string | null;
  companyName: string | null;
  cui: string | null;
  regCom: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  iban: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchClients: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    all?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseClientsReturn['pagination']>(null);

  const fetchClients = useCallback(async (params = {}) => {
    console.log('[useClients] fetchClients called with params:', params);
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.all) queryParams.append('pageSize', '10000'); // Large number to get all
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `/api/clients?${queryParams.toString()}`;
      console.log('[useClients] Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('[useClients] Response status:', response.status, response.ok);
      
      const result = await response.json();
      console.log('[useClients] Response data:', { 
        success: result.success, 
        dataCount: result.data?.length || 0,
        error: result.error 
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clients');
      }

      // Ensure data is an array
      const clientsData = Array.isArray(result.data) ? result.data : [];
      setClients(clientsData);
      setPagination(result.pagination || null);
      console.log('[useClients] Clients set, count:', clientsData.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clients';
      console.error('[useClients] Error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data: Partial<Client>): Promise<Client | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create client');
      }

      setClients((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (
    id: string,
    data: Partial<Client>
  ): Promise<Client | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update client');
      }

      setClients((prev) => prev.map((client) => (client.id === id ? result.data : client)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete client');
      }

      setClients((prev) => prev.filter((client) => client.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}

