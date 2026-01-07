import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { PaymentFilters } from '@/hooks/useQuickPayment';

// Create mock functions
const mockFetchPayments = vi.fn().mockResolvedValue(undefined);
const mockFetchSummary = vi.fn().mockResolvedValue(undefined);
const mockFetchClients = vi.fn().mockResolvedValue(undefined);
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

// Mock dependencies before importing the hook
vi.mock('@/hooks/usePayments', () => ({
  usePayments: vi.fn(() => ({
    fetchPayments: mockFetchPayments,
    fetchSummary: mockFetchSummary,
  })),
}));

vi.mock('@/hooks/useClients', () => ({
  useClients: vi.fn(() => ({
    fetchClients: mockFetchClients,
  })),
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: {
      id: 'user-1',
      parishId: 'parish-1',
    },
  })),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockShowSuccess,
    error: mockShowError,
  })),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      paymentCreated: 'Payment created successfully',
      fillRequiredFields: 'Please fill all required fields',
    };
    return translations[key] || key;
  }),
}));

// Import hook after mocks are set up
import { useQuickPayment } from '@/hooks/useQuickPayment';

// Mock fetch globally
global.fetch = vi.fn();

describe('useQuickPayment', () => {
  const mockFilters: PaymentFilters = {
    currentPage: 1,
    searchTerm: '',
    parishFilter: 'parish-1',
    typeFilter: '',
    statusFilter: '',
    categoryFilter: '',
    dateFrom: '',
    dateTo: '',
  };

  const mockParishes = [
    { id: 'parish-1', name: 'Parish 1' },
    { id: 'parish-2', name: 'Parish 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPayments.mockResolvedValue(undefined);
    mockFetchSummary.mockResolvedValue(undefined);
    mockFetchClients.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with empty form', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      expect(result.current.quickPaymentForm).toEqual({
        parishId: '',
        clientId: '',
        clientDisplayName: '',
        amount: '',
        reason: '',
        category: 'donation',
        sendEmail: true,
        emailAddress: '',
      });
      expect(result.current.quickPaymentLoading).toBe(false);
    });
  });

  describe('resetQuickPaymentForm', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Modify form
      act(() => {
        result.current.setQuickPaymentForm({
          parishId: 'parish-1',
          clientId: 'client-1',
          clientDisplayName: 'Client 1',
          amount: '100',
          reason: 'Test reason',
          category: 'donation',
          sendEmail: false,
          emailAddress: 'test@example.com',
        });
      });

      // Reset form
      act(() => {
        result.current.resetQuickPaymentForm();
      });

      expect(result.current.quickPaymentForm).toEqual({
        parishId: '',
        clientId: '',
        clientDisplayName: '',
        amount: '',
        reason: '',
        category: 'donation',
        sendEmail: true,
        emailAddress: '',
      });
    });
  });

  describe('preselectUserParish', () => {
    it('should preselect user parish when parish exists in list', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      act(() => {
        result.current.preselectUserParish(mockParishes);
      });

      expect(result.current.quickPaymentForm.parishId).toBe('parish-1');
    });

    it('should not preselect if parish does not exist in list', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      const parishesWithoutUserParish = [{ id: 'parish-2', name: 'Parish 2' }];

      act(() => {
        result.current.preselectUserParish(parishesWithoutUserParish);
      });

      expect(result.current.quickPaymentForm.parishId).toBe('');
    });

    it('should not preselect if form already has parishId', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Set parish first
      act(() => {
        result.current.setQuickPaymentForm((prev) => ({
          ...prev,
          parishId: 'parish-2',
        }));
      });

      // Try to preselect user parish
      act(() => {
        result.current.preselectUserParish(mockParishes);
      });

      // Should keep existing parish
      expect(result.current.quickPaymentForm.parishId).toBe('parish-2');
    });
  });

  describe('handleClientSearch', () => {
    it('should debounce client search', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      act(() => {
        result.current.handleClientSearch('test');
      });

      // Should not call immediately
      expect(mockFetchClients).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should call after debounce
      expect(mockFetchClients).toHaveBeenCalledWith({
        search: 'test',
        pageSize: 50,
      });
    });

    it('should not search if term is less than 3 characters', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      act(() => {
        result.current.handleClientSearch('te');
        vi.advanceTimersByTime(300);
      });

      expect(mockFetchClients).not.toHaveBeenCalled();
    });

    it('should clear previous timeout when new search is triggered', () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // First search
      act(() => {
        result.current.handleClientSearch('test1');
      });

      // Second search before first completes
      act(() => {
        vi.advanceTimersByTime(150);
        result.current.handleClientSearch('test2');
      });

      // Fast-forward to complete second search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only be called once with the second search term
      expect(mockFetchClients).toHaveBeenCalledTimes(1);
      expect(mockFetchClients).toHaveBeenCalledWith({
        search: 'test2',
        pageSize: 50,
      });
    });
  });

  describe('handleQuickPaymentSubmit', () => {
    it('should submit quick payment successfully', async () => {
      const mockOnSuccess = vi.fn();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'payment-1' },
        }),
      });

      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
          onSuccess: mockOnSuccess,
        })
      );

      // Set valid form data
      act(() => {
        result.current.setQuickPaymentForm({
          parishId: 'parish-1',
          clientId: 'client-1',
          clientDisplayName: 'Client 1',
          amount: '100.50',
          reason: 'Test payment',
          category: 'donation',
          sendEmail: false,
          emailAddress: '',
        });
      });

      const t = (key: string) => key;

      await act(async () => {
        await result.current.handleQuickPaymentSubmit(t);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/accounting/payments/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parishId: 'parish-1',
          clientId: 'client-1',
          amount: 100.5,
          reason: 'Test payment',
          category: 'donation',
          sendEmail: false,
        }),
      });
      expect(mockFetchPayments).toHaveBeenCalled();
      expect(mockFetchSummary).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(result.current.quickPaymentLoading).toBe(false);
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Set invalid form data (missing required fields)
      act(() => {
        result.current.setQuickPaymentForm({
          parishId: '',
          clientId: '',
          clientDisplayName: '',
          amount: '',
          reason: '',
          category: 'donation',
          sendEmail: false,
          emailAddress: '',
        });
      });

      const t = (key: string) => key;

      await act(async () => {
        await result.current.handleQuickPaymentSubmit(t);
      });

      expect(mockShowError).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.quickPaymentLoading).toBe(false);
    });

    it('should handle API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Payment creation failed',
        }),
      });

      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Set valid form data
      act(() => {
        result.current.setQuickPaymentForm({
          parishId: 'parish-1',
          clientId: 'client-1',
          clientDisplayName: 'Client 1',
          amount: '100',
          reason: 'Test payment',
          category: 'donation',
          sendEmail: false,
          emailAddress: '',
        });
      });

      const t = (key: string) => key;

      await act(async () => {
        await result.current.handleQuickPaymentSubmit(t);
      });

      expect(mockShowError).toHaveBeenCalledWith('Payment creation failed');
      expect(result.current.quickPaymentLoading).toBe(false);
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Set valid form data
      act(() => {
        result.current.setQuickPaymentForm({
          parishId: 'parish-1',
          clientId: 'client-1',
          clientDisplayName: 'Client 1',
          amount: '100',
          reason: 'Test payment',
          category: 'donation',
          sendEmail: false,
          emailAddress: '',
        });
      });

      const t = (key: string) => key;

      await act(async () => {
        await result.current.handleQuickPaymentSubmit(t);
      });

      expect(mockShowError).toHaveBeenCalled();
      expect(result.current.quickPaymentLoading).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useQuickPayment({
          filters: mockFilters,
        })
      );

      // Start a search
      act(() => {
        result.current.handleClientSearch('test');
      });

      // Unmount before timeout completes
      unmount();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not call fetchClients after unmount
      expect(mockFetchClients).not.toHaveBeenCalled();
    });
  });
});
