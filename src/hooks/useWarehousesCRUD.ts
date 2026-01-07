import { useCallback, useMemo } from 'react';
import { useWarehouses, Warehouse } from '@/hooks/useWarehouses';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { WarehouseFormData } from '@/components/accounting/WarehouseAddModal';
import {
  createEmptyWarehouseFormData,
  warehouseToFormData,
  warehouseFormDataToCreateData,
  warehouseFormDataToUpdateData,
} from '@/lib/utils/warehouses';
import { validateWarehouseForm } from '@/lib/validations/warehouses';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue, normalizeBooleanFilter } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseWarehousesCRUDParams {
  searchTerm: string;
  typeFilter: string;
  isActiveFilter: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseWarehousesCRUDReturn {
  // Data
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Warehouse, WarehouseFormData, Partial<Warehouse>, Partial<Warehouse>>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleTypeFilterChange: () => void;
  handleIsActiveFilterChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all warehouses CRUD logic
 * Separates business logic from presentation
 */
export function useWarehousesCRUD(params: UseWarehousesCRUDParams, t: (key: string) => string): UseWarehousesCRUDReturn {
  const { searchTerm, typeFilter, isActiveFilter, currentPage, onPageChange } = params;
  
  const {
    warehouses,
    loading,
    error,
    pagination,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehouses();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      type: normalizeFilterValue(typeFilter) as 'general' | 'retail' | 'storage' | 'temporary' | undefined,
      isActive: normalizeBooleanFilter(isActiveFilter),
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [currentPage, searchTerm, typeFilter, isActiveFilter]
  );
  
  // Refresh function
  const refreshWarehouses = useCallback(() => {
    fetchWarehouses(fetchParams);
  }, [fetchParams, fetchWarehouses]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Warehouse, WarehouseFormData, Partial<Warehouse>, Partial<Warehouse>> = useMemo(
    () => ({
      fetchEntities: fetchWarehouses,
      createEntity: createWarehouse,
      updateEntity: updateWarehouse,
      deleteEntity: deleteWarehouse,
      createEmptyFormData: createEmptyWarehouseFormData,
      entityToFormData: warehouseToFormData,
      formDataToCreateData: warehouseFormDataToCreateData,
      formDataToUpdateData: warehouseFormDataToUpdateData,
      validateForm: validateWarehouseForm,
      refreshEntities: refreshWarehouses,
    }),
    [createWarehouse, updateWarehouse, deleteWarehouse, fetchWarehouses, refreshWarehouses]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleIsActiveFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    warehouses,
    loading,
    error,
    pagination,
    crud,
    handleSearchChange,
    handleTypeFilterChange,
    handleIsActiveFilterChange,
    handleClearFilters,
  };
}

