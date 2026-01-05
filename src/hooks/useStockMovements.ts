'use client';

import { useState, useCallback } from 'react';

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  parishId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
  movementDate: string;
  quantity: string;
  unitCost: string | null;
  totalValue: string | null;
  invoiceId: string | null;
  invoiceItemIndex: number | null;
  documentType: string | null;
  documentNumber: string | null;
  documentDate: string | null;
  clientId: string | null;
  destinationWarehouseId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

interface UseStockMovementsReturn {
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchStockMovements: (params?: {
    page?: number;
    pageSize?: number;
    warehouseId?: string;
    productId?: string;
    parishId?: string;
    type?: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
    dateFrom?: string;
    dateTo?: string;
    invoiceId?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createStockMovement: (data: Partial<StockMovement>) => Promise<StockMovement | null>;
  updateStockMovement: (id: string, data: Partial<StockMovement>) => Promise<StockMovement | null>;
  deleteStockMovement: (id: string) => Promise<boolean>;
  transferStock: (data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    parishId: string;
    movementDate: string;
    quantity: string;
    unitCost?: string | null;
    notes?: string | null;
  }) => Promise<{ outMovement: StockMovement; inMovement: StockMovement } | null>;
}

export function useStockMovements(): UseStockMovementsReturn {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseStockMovementsReturn['pagination']>(null);

  const fetchStockMovements = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.type) queryParams.append('type', params.type);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.invoiceId) queryParams.append('invoiceId', params.invoiceId);
      if (params.clientId) queryParams.append('clientId', params.clientId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/stock-movements?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stock movements');
      }

      setStockMovements(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock movements';
      setError(errorMessage);
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStockMovement = useCallback(async (data: Partial<StockMovement>): Promise<StockMovement | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create stock movement');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stock movement';
      setError(errorMessage);
      console.error('Error creating stock movement:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStockMovement = useCallback(async (id: string, data: Partial<StockMovement>): Promise<StockMovement | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/stock-movements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update stock movement');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stock movement';
      setError(errorMessage);
      console.error('Error updating stock movement:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStockMovement = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/stock-movements/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete stock movement');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stock movement';
      setError(errorMessage);
      console.error('Error deleting stock movement:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const transferStock = useCallback(async (data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    parishId: string;
    movementDate: string;
    quantity: string;
    unitCost?: string | null;
    notes?: string | null;
  }): Promise<{ outMovement: StockMovement; inMovement: StockMovement } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/stock-movements/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to transfer stock');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer stock';
      setError(errorMessage);
      console.error('Error transferring stock:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stockMovements,
    loading,
    error,
    pagination,
    fetchStockMovements,
    createStockMovement,
    updateStockMovement,
    deleteStockMovement,
    transferStock,
  };
}

