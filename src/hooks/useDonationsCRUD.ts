import { useCallback, useMemo } from 'react';
import { useDonations, Donation } from '@/hooks/useDonations';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { DonationFormData } from '@/lib/validations/donations';
import { CreateDonationData, UpdateDonationData } from '@/lib/types/payments';
import {
  createEmptyDonationFormData,
  donationToFormData,
  donationFormDataToCreateData,
  donationFormDataToUpdateData,
} from '@/lib/utils/donations';
import { validateDonationForm } from '@/lib/validations/donations';
import { PaginationInfo } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseDonationsCRUDParams {
  searchTerm: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseDonationsCRUDReturn {
  // Data
  donations: Donation[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Donation, DonationFormData, CreateDonationData, UpdateDonationData>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleStatusFilterChange: () => void;
  handleDateFromChange: () => void;
  handleDateToChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all donations CRUD logic
 * Separates business logic from presentation
 */
export function useDonationsCRUD(params: UseDonationsCRUDParams, t: (key: string) => string): UseDonationsCRUDReturn {
  const { searchTerm, statusFilter, dateFrom, dateTo, currentPage, onPageChange } = params;
  
  const {
    donations,
    loading,
    error,
    pagination,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  } = useDonations();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      status: normalizeFilterValue(statusFilter) as 'pending' | 'completed' | 'cancelled' | undefined,
      dateFrom: normalizeFilterValue(dateFrom),
      dateTo: normalizeFilterValue(dateTo),
      sortBy: 'date',
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, statusFilter, dateFrom, dateTo]
  );
  
  // Refresh function
  const refreshDonations = useCallback(() => {
    fetchDonations(fetchParams);
  }, [fetchParams, fetchDonations]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Donation, DonationFormData, CreateDonationData, UpdateDonationData> = useMemo(
    () => ({
      fetchEntities: fetchDonations,
      createEntity: createDonation,
      updateEntity: updateDonation,
      deleteEntity: deleteDonation,
      createEmptyFormData: createEmptyDonationFormData,
      entityToFormData: donationToFormData,
      formDataToCreateData: donationFormDataToCreateData,
      formDataToUpdateData: donationFormDataToUpdateData,
      validateForm: validateDonationForm,
      refreshEntities: refreshDonations,
    }),
    [createDonation, updateDonation, deleteDonation, fetchDonations, refreshDonations]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleStatusFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateFromChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateToChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    donations,
    loading,
    error,
    pagination,
    crud,
    handleSearchChange,
    handleStatusFilterChange,
    handleDateFromChange,
    handleDateToChange,
    handleClearFilters,
  };
}

