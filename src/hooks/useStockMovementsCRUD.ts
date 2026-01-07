import { useCallback, useMemo } from 'react';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { StockMovementFormData } from '@/components/accounting/StockMovementAddModal';
import {
  createEmptyStockMovementFormData,
  stockMovementToFormData,
  stockMovementFormDataToCreateData,
  stockMovementFormDataToUpdateData,
} from '@/lib/utils/stockMovements';
import { validateStockMovementForm } from '@/lib/validations/stockMovements';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseStockMovementsCRUDParams {
  warehouseFilter: string;
  productFilter: string;
  typeFilter: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseStockMovementsCRUDReturn {
  // Data
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<StockMovement, StockMovementFormData, Partial<StockMovement>, Partial<StockMovement>>>;
  
  // Filter handlers
  handleWarehouseFilterChange: () => void;
  handleProductFilterChange: () => void;
  handleTypeFilterChange: () => void;
  handleDateFromChange: () => void;
  handleDateToChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all stock movements CRUD logic
 * Separates business logic from presentation
 */
export function useStockMovementsCRUD(params: UseStockMovementsCRUDParams, t: (key: string) => string): UseStockMovementsCRUDReturn {
  const { warehouseFilter, productFilter, typeFilter, dateFrom, dateTo, currentPage, onPageChange } = params;
  
  const {
    stockMovements,
    loading,
    error,
    pagination,
    fetchStockMovements,
    createStockMovement,
    updateStockMovement,
    deleteStockMovement,
  } = useStockMovements();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      warehouseId: normalizeFilterValue(warehouseFilter),
      productId: normalizeFilterValue(productFilter),
      type: normalizeFilterValue(typeFilter) as 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | undefined,
      dateFrom: normalizeFilterValue(dateFrom),
      dateTo: normalizeFilterValue(dateTo),
      sortBy: 'movementDate',
      sortOrder: 'desc' as const,
    }),
    [currentPage, warehouseFilter, productFilter, typeFilter, dateFrom, dateTo]
  );
  
  // Refresh function
  const refreshStockMovements = useCallback(() => {
    fetchStockMovements(fetchParams);
  }, [fetchParams, fetchStockMovements]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<StockMovement, StockMovementFormData, Partial<StockMovement>, Partial<StockMovement>> = useMemo(
    () => ({
      fetchEntities: fetchStockMovements,
      createEntity: createStockMovement,
      updateEntity: updateStockMovement,
      deleteEntity: deleteStockMovement,
      createEmptyFormData: createEmptyStockMovementFormData,
      entityToFormData: stockMovementToFormData,
      formDataToCreateData: stockMovementFormDataToCreateData,
      formDataToUpdateData: stockMovementFormDataToUpdateData,
      validateForm: validateStockMovementForm,
      refreshEntities: refreshStockMovements,
    }),
    [createStockMovement, updateStockMovement, deleteStockMovement, fetchStockMovements, refreshStockMovements]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleWarehouseFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleProductFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateFromChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateToChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    stockMovements,
    loading,
    error,
    pagination,
    crud,
    handleWarehouseFilterChange,
    handleProductFilterChange,
    handleTypeFilterChange,
    handleDateFromChange,
    handleDateToChange,
    handleClearFilters,
  };
}

