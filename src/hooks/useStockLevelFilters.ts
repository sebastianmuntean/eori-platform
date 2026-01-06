import { useState, useCallback } from 'react';

export interface StockLevelFiltersState {
  parishFilter: string;
  warehouseFilter: string;
  showLowStock: boolean;
}

const getInitialFilters = (): StockLevelFiltersState => ({
  parishFilter: '',
  warehouseFilter: '',
  showLowStock: false,
});

export function useStockLevelFilters() {
  const [filters, setFilters] = useState<StockLevelFiltersState>(getInitialFilters());

  const updateFilters = useCallback((updates: Partial<StockLevelFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(getInitialFilters());
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}





