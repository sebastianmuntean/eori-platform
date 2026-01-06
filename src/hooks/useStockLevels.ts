'use client';

import { useState, useCallback } from 'react';

export interface StockLevel {
  warehouseId: string;
  productId: string;
  quantity: number;
  totalValue: number;
  lastMovementDate: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  } | null;
  product: {
    id: string;
    name: string;
    code: string;
    unit: string;
    minStock: number | null;
  } | null;
}

interface UseStockLevelsReturn {
  stockLevels: StockLevel[];
  loading: boolean;
  error: string | null;
  fetchStockLevels: (params?: {
    warehouseId?: string;
    productId?: string;
    parishId?: string;
    lowStock?: boolean;
  }) => Promise<void>;
  fetchStockLevelsByWarehouse: (warehouseId: string) => Promise<void>;
  fetchStockLevelsByProduct: (productId: string) => Promise<void>;
  fetchLowStock: (parishId?: string) => Promise<void>;
}

export function useStockLevels(): UseStockLevelsReturn {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockLevels = useCallback(async (params: {
    warehouseId?: string;
    productId?: string;
    parishId?: string;
    lowStock?: boolean;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.lowStock) queryParams.append('lowStock', 'true');

      const response = await fetch(`/api/accounting/stock-levels?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stock levels');
      }

      setStockLevels(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock levels';
      setError(errorMessage);
      console.error('Error fetching stock levels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockLevelsByWarehouse = useCallback(async (warehouseId: string) => {
    await fetchStockLevels({ warehouseId });
  }, [fetchStockLevels]);

  const fetchStockLevelsByProduct = useCallback(async (productId: string) => {
    await fetchStockLevels({ productId });
  }, [fetchStockLevels]);

  const fetchLowStock = useCallback(async (parishId?: string) => {
    await fetchStockLevels({ lowStock: true, parishId });
  }, [fetchStockLevels]);

  return {
    stockLevels,
    loading,
    error,
    fetchStockLevels,
    fetchStockLevelsByWarehouse,
    fetchStockLevelsByProduct,
    fetchLowStock,
  };
}

