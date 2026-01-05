'use client';

import { useState, useCallback } from 'react';

export interface InventorySession {
  id: string;
  parishId: string;
  warehouseId: string | null;
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parish?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
  createdByUser?: { id: string; name: string } | null;
  itemCount?: number;
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  sessionId: string;
  itemType: 'product' | 'fixed_asset';
  itemId: string;
  bookQuantity: string | null;
  physicalQuantity: string | null;
  difference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookInventoryItem {
  type: 'product' | 'fixed_asset';
  id: string;
  itemId: string;
  code: string;
  name: string;
  category: string | null;
  unit: string;
  quantity: number;
  value: number;
  location?: string | null;
  warehouse?: { id: string; name: string; code: string } | null;
}

interface UseInventoryReturn {
  sessions: InventorySession[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchSessions: (params?: {
    page?: number;
    pageSize?: number;
    parishId?: string;
    warehouseId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createSession: (data: {
    parishId: string;
    warehouseId?: string | null;
    date: string;
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string | null;
  }) => Promise<InventorySession | null>;
  updateSession: (id: string, data: {
    warehouseId?: string | null;
    date?: string;
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string | null;
  }) => Promise<InventorySession | null>;
  deleteSession: (id: string) => Promise<boolean>;
  getSession: (id: string) => Promise<InventorySession | null>;
  completeSession: (id: string) => Promise<boolean>;
  fetchBookInventory: (params?: {
    parishId?: string;
    warehouseId?: string;
    type?: 'product' | 'fixed_asset';
  }) => Promise<BookInventoryItem[]>;
}

export function useInventory(): UseInventoryReturn {
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseInventoryReturn['pagination']>(null);

  const fetchSessions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/pangare/inventar?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inventory sessions');
      }

      setSessions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory sessions';
      setError(errorMessage);
      console.error('Error fetching inventory sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (data: {
    parishId: string;
    warehouseId?: string | null;
    date: string;
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string | null;
  }): Promise<InventorySession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pangare/inventar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create inventory session');
      }

      await fetchSessions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create inventory session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  const updateSession = useCallback(async (id: string, data: {
    warehouseId?: string | null;
    date?: string;
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string | null;
  }): Promise<InventorySession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pangare/inventar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update inventory session');
      }

      await fetchSessions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pangare/inventar/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete inventory session');
      }

      await fetchSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete inventory session';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  const getSession = useCallback(async (id: string): Promise<InventorySession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pangare/inventar/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inventory session');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSession = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pangare/inventar/${id}/complete`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete inventory session');
      }

      await fetchSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete inventory session';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  const fetchBookInventory = useCallback(async (params = {}): Promise<BookInventoryItem[]> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId);
      if (params.type) queryParams.append('type', params.type);

      const response = await fetch(`/api/pangare/inventar/book-inventory?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch book inventory');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch book inventory';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    pagination,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    completeSession,
    fetchBookInventory,
  };
}



