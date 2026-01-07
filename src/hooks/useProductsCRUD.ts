import { useCallback, useMemo } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { ProductFormData } from '@/components/accounting/products/ProductFormFields';
import {
  createEmptyProductFormData,
  productToFormData,
  productFormDataToCreateData,
  productFormDataToUpdateData,
} from '@/lib/utils/products';
import { validateProductForm } from '@/lib/validations/products';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue, normalizeBooleanFilter } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseProductsCRUDParams {
  searchTerm: string;
  categoryFilter: string;
  isActiveFilter: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseProductsCRUDReturn {
  // Data
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Product, ProductFormData, Partial<Product>, Partial<Product>>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleCategoryFilterChange: () => void;
  handleIsActiveFilterChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all products CRUD logic
 * Separates business logic from presentation
 */
export function useProductsCRUD(params: UseProductsCRUDParams, t: (key: string) => string): UseProductsCRUDReturn {
  const { searchTerm, categoryFilter, isActiveFilter, currentPage, onPageChange } = params;
  
  const {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      category: normalizeFilterValue(categoryFilter),
      isActive: normalizeBooleanFilter(isActiveFilter),
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [currentPage, searchTerm, categoryFilter, isActiveFilter]
  );
  
  // Refresh function
  const refreshProducts = useCallback(() => {
    fetchProducts(fetchParams);
  }, [fetchParams, fetchProducts]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Product, ProductFormData, Partial<Product>, Partial<Product>> = useMemo(
    () => ({
      fetchEntities: fetchProducts,
      createEntity: createProduct,
      updateEntity: updateProduct,
      deleteEntity: deleteProduct,
      createEmptyFormData: createEmptyProductFormData,
      entityToFormData: productToFormData,
      formDataToCreateData: productFormDataToCreateData,
      formDataToUpdateData: productFormDataToUpdateData,
      validateForm: validateProductForm,
      refreshEntities: refreshProducts,
    }),
    [createProduct, updateProduct, deleteProduct, fetchProducts, refreshProducts]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleCategoryFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleIsActiveFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    products,
    loading,
    error,
    pagination,
    crud,
    handleSearchChange,
    handleCategoryFilterChange,
    handleIsActiveFilterChange,
    handleClearFilters,
  };
}

