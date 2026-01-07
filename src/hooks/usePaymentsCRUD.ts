import { useCallback, useMemo } from 'react';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { PaymentFormData } from '@/lib/validations/payments';
import { CreatePaymentData, UpdatePaymentData } from '@/lib/types/payments';
import {
  createEmptyPaymentFormData,
  paymentToFormData,
  paymentFormDataToCreateData,
  paymentFormDataToUpdateData,
} from '@/lib/utils/payments';
import { validatePaymentForm } from '@/lib/validations/payments';
import { PaginationInfo, PaymentSummary } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UsePaymentsCRUDParams {
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  categoryFilter: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UsePaymentsCRUDReturn {
  // Data
  payments: Payment[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  summary: PaymentSummary | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Payment, PaymentFormData, CreatePaymentData, UpdatePaymentData>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleTypeFilterChange: () => void;
  handleStatusFilterChange: () => void;
  handleCategoryFilterChange: () => void;
  handleDateFromChange: () => void;
  handleDateToChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all payments CRUD logic
 * Separates business logic from presentation
 */
export function usePaymentsCRUD(params: UsePaymentsCRUDParams, t: (key: string) => string): UsePaymentsCRUDReturn {
  const { searchTerm, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, currentPage, onPageChange } = params;
  
  const {
    payments,
    loading,
    error,
    pagination,
    summary,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  } = usePayments();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      type: normalizeFilterValue(typeFilter) as 'income' | 'expense' | undefined,
      status: normalizeFilterValue(statusFilter) as 'pending' | 'completed' | 'cancelled' | undefined,
      category: normalizeFilterValue(categoryFilter),
      dateFrom: normalizeFilterValue(dateFrom),
      dateTo: normalizeFilterValue(dateTo),
      sortBy: 'date',
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo]
  );
  
  // Refresh function
  const refreshPayments = useCallback(() => {
    fetchPayments(fetchParams);
  }, [fetchParams, fetchPayments]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Payment, PaymentFormData, CreatePaymentData, UpdatePaymentData> = useMemo(
    () => ({
      fetchEntities: fetchPayments,
      createEntity: createPayment,
      updateEntity: updatePayment,
      deleteEntity: deletePayment,
      createEmptyFormData: createEmptyPaymentFormData,
      entityToFormData: paymentToFormData,
      formDataToCreateData: paymentFormDataToCreateData,
      formDataToUpdateData: paymentFormDataToUpdateData,
      validateForm: validatePaymentForm,
      refreshEntities: refreshPayments,
    }),
    [createPayment, updatePayment, deletePayment, fetchPayments, refreshPayments]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleStatusFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleCategoryFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateFromChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateToChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    payments,
    loading,
    error,
    pagination,
    summary,
    crud,
    handleSearchChange,
    handleTypeFilterChange,
    handleStatusFilterChange,
    handleCategoryFilterChange,
    handleDateFromChange,
    handleDateToChange,
    handleClearFilters,
  };
}

