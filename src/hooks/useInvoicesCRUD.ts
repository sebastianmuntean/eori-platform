import { useCallback, useMemo } from 'react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { InvoiceFormData } from '@/lib/validations/invoices';
import {
  createEmptyInvoiceFormData,
  invoiceToFormData,
  invoiceFormDataToCreateData,
  invoiceFormDataToUpdateData,
} from '@/lib/utils/invoices';
import { validateInvoiceForm } from '@/lib/validations/invoices';
import { PaginationInfo, InvoiceSummary } from '@/hooks/shared/types';
import { createStandardFilterHandler, normalizeFilterValue } from '@/hooks/shared/crudHelpers';

const PAGE_SIZE = 10;

export interface UseInvoicesCRUDParams {
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseInvoicesCRUDReturn {
  // Data
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  summary: InvoiceSummary | null;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Invoice, InvoiceFormData, Partial<Invoice>, Partial<Invoice>>>;
  
  // Filter handlers
  handleSearchChange: () => void;
  handleTypeFilterChange: () => void;
  handleStatusFilterChange: () => void;
  handleDateFromChange: () => void;
  handleDateToChange: () => void;
  handleClearFilters: () => void;
}

/**
 * Custom hook that encapsulates all invoices CRUD logic
 * Separates business logic from presentation
 */
export function useInvoicesCRUD(params: UseInvoicesCRUDParams, t: (key: string) => string): UseInvoicesCRUDReturn {
  const { searchTerm, typeFilter, statusFilter, dateFrom, dateTo, currentPage, onPageChange } = params;
  
  const {
    invoices,
    loading,
    error,
    pagination,
    summary,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  } = useInvoices();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: normalizeFilterValue(searchTerm),
      type: normalizeFilterValue(typeFilter) as 'issued' | 'received' | undefined,
      status: normalizeFilterValue(statusFilter) as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | undefined,
      dateFrom: normalizeFilterValue(dateFrom),
      dateTo: normalizeFilterValue(dateTo),
      sortBy: 'date',
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, typeFilter, statusFilter, dateFrom, dateTo]
  );
  
  // Refresh function
  const refreshInvoices = useCallback(() => {
    fetchInvoices(fetchParams);
  }, [fetchParams, fetchInvoices]);
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Invoice, InvoiceFormData, Partial<Invoice>, Partial<Invoice>> = useMemo(
    () => ({
      fetchEntities: fetchInvoices,
      createEntity: createInvoice,
      updateEntity: updateInvoice,
      deleteEntity: deleteInvoice,
      createEmptyFormData: createEmptyInvoiceFormData,
      entityToFormData: invoiceToFormData,
      formDataToCreateData: invoiceFormDataToCreateData,
      formDataToUpdateData: invoiceFormDataToUpdateData,
      validateForm: validateInvoiceForm,
      refreshEntities: refreshInvoices,
    }),
    [createInvoice, updateInvoice, deleteInvoice, fetchInvoices, refreshInvoices]
  );
  
  // Use the generic CRUD hook
  const crud = useEntityCRUD(crudConfig, t);
  
  // Filter handlers with page reset - using shared utility
  const handleSearchChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleTypeFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleStatusFilterChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateFromChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleDateToChange = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  const handleClearFilters = useMemo(() => createStandardFilterHandler(onPageChange), [onPageChange]);
  
  return {
    invoices,
    loading,
    error,
    pagination,
    summary,
    crud,
    handleSearchChange,
    handleTypeFilterChange,
    handleStatusFilterChange,
    handleDateFromChange,
    handleDateToChange,
    handleClearFilters,
  };
}

