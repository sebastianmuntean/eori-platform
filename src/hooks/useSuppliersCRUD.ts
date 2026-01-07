import { useCallback, useMemo } from 'react';
import { useClients, Client } from '@/hooks/useClients';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { ClientFormData } from '@/components/accounting/ClientForm';
import {
  createEmptySupplierFormData,
  supplierToFormData,
  supplierFormDataToCreateData,
  supplierFormDataToUpdateData,
  getClientType,
} from '@/lib/utils/suppliers';
import { validateSupplierForm } from '@/lib/validations/suppliers';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseSuppliersCRUDParams {
  searchTerm: string;
  typeFilter: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseSuppliersCRUDReturn {
  // Data
  suppliers: Client[];
  filteredSuppliers: Client[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Client, ClientFormData, Partial<Client>, Partial<Client>>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleTypeFilterChange: () => void;
  handleClearFilters: () => void;
  
  // Helper functions
  getSupplierType: (supplier: Client) => 'person' | 'company' | 'organization';
}

/**
 * Custom hook that encapsulates all suppliers CRUD logic
 * Suppliers use the Client type and form data structure
 */
/**
 * Custom hook that encapsulates all suppliers CRUD logic
 * Suppliers use the Client type and form data structure
 * 
 * Note: Validation requires clientType which is managed in the component,
 * so validation is handled at the component level rather than in the hook.
 */
export function useSuppliersCRUD(params: UseSuppliersCRUDParams, t: (key: string) => string): UseSuppliersCRUDReturn {
  const { searchTerm, typeFilter, currentPage, onPageChange } = params;
  
  const {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      sortBy: 'code' as const,
      sortOrder: 'asc' as const,
    }),
    [currentPage, searchTerm]
  );
  
  // Refresh function
  const refreshSuppliers = useCallback(() => {
    fetchClients(fetchParams);
  }, [fetchParams, fetchClients]);
  
  // Filter suppliers by type on client-side
  const filteredSuppliers = useMemo(
    () => (typeFilter ? clients.filter((client) => getClientType(client) === typeFilter) : clients),
    [clients, typeFilter]
  );
  
  // CRUD configuration
  // Note: Validation requires clientType which is managed in the component.
  // The component should call validateSupplierForm directly with the clientType.
  const crudConfig: EntityCRUDConfig<Client, ClientFormData, Partial<Client>, Partial<Client>> = useMemo(
    () => ({
      fetchEntities: fetchClients,
      createEntity: createClient,
      updateEntity: updateClient,
      deleteEntity: deleteClient,
      createEmptyFormData: createEmptySupplierFormData,
      entityToFormData: supplierToFormData,
      formDataToCreateData: supplierFormDataToCreateData,
      formDataToUpdateData: supplierFormDataToUpdateData,
      // Validation is handled at component level with clientType
      // This allows the component to pass the clientType to validateSupplierForm
      validateForm: () => null,
      refreshEntities: refreshSuppliers,
    }),
    [createClient, updateClient, deleteClient, fetchClients, refreshSuppliers]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    suppliers: clients,
    filteredSuppliers,
    loading,
    error,
    pagination,
    crud,
    handleSearchChange,
    handleTypeFilterChange,
    handleClearFilters,
    getSupplierType: getClientType,
  };
}

