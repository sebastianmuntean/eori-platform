'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { QuickPaymentFormData, quickPaymentFormToRequest } from '@/lib/types/payments';
import { useToast } from '@/hooks/useToast';
import { usePayments } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';
import { useUser } from '@/hooks/useUser';

/**
 * Payment filter state
 * Contains all filter values used for fetching payments
 */
export interface PaymentFilters {
  currentPage: number;
  searchTerm: string;
  parishFilter: string;
  typeFilter: string;
  statusFilter: string;
  categoryFilter: string;
  dateFrom: string;
  dateTo: string;
}

/**
 * Parameters for the useQuickPayment hook
 */
interface UseQuickPaymentParams {
  /** Payment filters used to refresh the list after quick payment creation */
  filters: PaymentFilters;
  /** Callback executed after successful quick payment creation */
  onSuccess?: () => void;
}

/**
 * Type guard to validate payment type
 */
const isValidPaymentType = (value: string): value is 'income' | 'expense' => {
  return value === 'income' || value === 'expense';
};

/**
 * Type guard to validate payment status
 */
const isValidPaymentStatus = (value: string): value is 'pending' | 'completed' | 'cancelled' => {
  return ['pending', 'completed', 'cancelled'].includes(value);
};

/**
 * Builds fetch parameters for payments API
 * Converts filter strings to proper types and removes empty values
 */
const buildPaymentFetchParams = (filters: PaymentFilters) => {
  return {
    page: filters.currentPage,
    pageSize: 10,
    search: filters.searchTerm || undefined,
    parishId: filters.parishFilter || undefined,
    type: isValidPaymentType(filters.typeFilter) ? filters.typeFilter : undefined,
    status: isValidPaymentStatus(filters.statusFilter) ? filters.statusFilter : undefined,
    category: filters.categoryFilter || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  };
};

/**
 * Builds summary fetch parameters
 * Only includes filters relevant to summary calculation
 */
const buildSummaryFetchParams = (filters: PaymentFilters) => {
  return {
    parishId: filters.parishFilter || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
};

const getInitialQuickPaymentForm = (): QuickPaymentFormData => ({
  parishId: '',
  clientId: '',
  clientDisplayName: '',
  amount: '',
  reason: '',
  category: 'donation',
  sendEmail: true,
  emailAddress: '',
});

/**
 * Custom hook for managing quick payment functionality
 * 
 * Handles:
 * - Quick payment form state
 * - Client search with debouncing
 * - Parish preselection
 * - Quick payment submission and payment list refresh
 * 
 * @param filters - Payment filters used to refresh the list after creation
 * @param onSuccess - Optional callback executed after successful payment creation
 * @returns Quick payment form state and handlers
 */
export function useQuickPayment({ filters, onSuccess }: UseQuickPaymentParams) {
  const [quickPaymentForm, setQuickPaymentForm] = useState<QuickPaymentFormData>(getInitialQuickPaymentForm());
  const [quickPaymentLoading, setQuickPaymentLoading] = useState(false);
  const { fetchPayments, fetchSummary } = usePayments();
  const { fetchClients } = useClients();
  const { user } = useUser();
  const { success: showSuccess, error: showError } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Resets the quick payment form to initial state
   */
  const resetQuickPaymentForm = useCallback(() => {
    setQuickPaymentForm(getInitialQuickPaymentForm());
  }, []);

  /**
   * Preselects user's parish when opening quick payment modal
   * Only preselects if the parish exists in the loaded parishes list
   */
  const preselectUserParish = useCallback(
    (parishes: Array<{ id: string }>) => {
      if (user?.parishId && !quickPaymentForm.parishId) {
        // Verify the parish exists in the loaded parishes list
        const userParishExists = parishes.some((p) => p.id === user.parishId);
        if (userParishExists) {
          setQuickPaymentForm((prev) => ({ ...prev, parishId: user.parishId! }));
        }
      }
    },
    [user?.parishId, quickPaymentForm.parishId]
  );

  /**
   * Debounced client search handler
   * Only searches if the search term is at least 3 characters long
   * Debounce delay: 300ms
   */
  const handleClientSearch = useCallback(
    (searchTerm: string) => {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Only search if term is at least 3 characters
      if (searchTerm && searchTerm.length >= 3) {
        searchTimeoutRef.current = setTimeout(() => {
          fetchClients({
            search: searchTerm,
            pageSize: 50,
          });
        }, 300);
      }
    },
    [fetchClients]
  );

  /**
   * Handles quick payment form submission
   * Validates form, creates payment via API, and refreshes the payments list
   */
  const handleQuickPaymentSubmit = useCallback(
    async (t: (key: string) => string) => {
      // Validate and convert form data to request format
      const requestData = quickPaymentFormToRequest(quickPaymentForm);

      if ('error' in requestData) {
        showError(t(requestData.error) || requestData.error);
        return;
      }

      setQuickPaymentLoading(true);
      try {
        const response = await fetch('/api/accounting/payments/quick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment');
        }

        // Success - reset form, refresh payments
        resetQuickPaymentForm();

        // Refresh payments list with current filters
        const paymentParams = buildPaymentFetchParams(filters);
        await fetchPayments(paymentParams);

        // Refresh summary with current filters
        const summaryParams = buildSummaryFetchParams(filters);
        await fetchSummary(summaryParams);

        showSuccess(t('paymentCreated') || 'Payment created successfully');
        onSuccess?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
        showError(errorMessage);
      } finally {
        setQuickPaymentLoading(false);
      }
    },
    [
      quickPaymentForm,
      filters,
      fetchPayments,
      fetchSummary,
      resetQuickPaymentForm,
      showSuccess,
      showError,
      onSuccess,
    ]
  );

  return {
    quickPaymentForm,
    setQuickPaymentForm,
    quickPaymentLoading,
    resetQuickPaymentForm,
    preselectUserParish,
    handleClientSearch,
    handleQuickPaymentSubmit,
  };
}

