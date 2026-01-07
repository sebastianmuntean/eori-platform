import { useCallback, useMemo } from 'react';
import { useContracts, Contract } from '@/hooks/useContracts';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { ContractFormData } from '@/components/accounting/ContractFormFields';
import {
  createEmptyContractFormData,
  contractToFormData,
  contractFormDataToCreateData,
  contractFormDataToUpdateData,
} from '@/lib/utils/contracts';
import { validateContractForm } from '@/lib/validations/contracts';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseContractsCRUDParams {
  searchTerm: string;
  directionFilter: string;
  typeFilter: string;
  statusFilter: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseContractsCRUDReturn {
  // Data
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Contract, ContractFormData, Partial<Contract>, Partial<Contract>>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleDirectionFilterChange: () => void;
  handleTypeFilterChange: () => void;
  handleStatusFilterChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all contracts CRUD logic
 * Separates business logic from presentation
 */
export function useContractsCRUD(params: UseContractsCRUDParams, t: (key: string) => string): UseContractsCRUDReturn {
  const { searchTerm, directionFilter, typeFilter, statusFilter, currentPage, onPageChange } = params;
  
  const {
    contracts,
    loading,
    error,
    pagination,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  } = useContracts();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      direction: normalizeFilterValue(directionFilter) as 'incoming' | 'outgoing' | undefined,
      type: normalizeFilterValue(typeFilter) as 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other' | undefined,
      status: normalizeFilterValue(statusFilter) as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed' | undefined,
      sortBy: 'contractNumber',
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, directionFilter, typeFilter, statusFilter]
  );
  
  // Refresh function
  const refreshContracts = useCallback(() => {
    fetchContracts(fetchParams);
  }, [fetchParams, fetchContracts]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Contract, ContractFormData, Partial<Contract>, Partial<Contract>> = useMemo(
    () => ({
      fetchEntities: fetchContracts,
      createEntity: createContract,
      updateEntity: updateContract,
      deleteEntity: deleteContract,
      createEmptyFormData: createEmptyContractFormData,
      entityToFormData: contractToFormData,
      formDataToCreateData: contractFormDataToCreateData,
      formDataToUpdateData: contractFormDataToUpdateData,
      validateForm: validateContractForm,
      refreshEntities: refreshContracts,
    }),
    [createContract, updateContract, deleteContract, fetchContracts, refreshContracts]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDirectionFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleStatusFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    contracts,
    loading,
    error,
    pagination,
    crud,
    handleSearchChange,
    handleDirectionFilterChange,
    handleTypeFilterChange,
    handleStatusFilterChange,
    handleClearFilters,
  };
}

