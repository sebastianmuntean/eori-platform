import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractInvoiceGeneration } from '@/hooks/useContractInvoiceGeneration';
import { Contract, ContractInvoice } from '@/hooks/useContracts';

describe('useContractInvoiceGeneration', () => {
  const mockContract: Contract = {
    id: 'contract-1',
    parishId: 'parish-1',
    contractNumber: 'CONTRACT-001',
    direction: 'incoming',
    type: 'rental',
    status: 'active',
    clientId: 'client-1',
    title: 'Test Contract',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    signingDate: '2024-01-01',
    amount: '1000.00',
    currency: 'RON',
    paymentFrequency: 'monthly',
    assetReference: null,
    description: null,
    terms: null,
    notes: null,
    renewalDate: null,
    autoRenewal: false,
    parentContractId: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'user-1',
  };

  const mockInvoice = {
    invoice: {
      id: 'invoice-1',
      invoiceNumber: 'INV-001',
      amount: '1000.00',
      currency: 'RON',
    },
    contractInvoice: {
      id: 'ci-1',
      contractId: 'contract-1',
      invoiceId: 'invoice-1',
    },
  };

  const mockContractInvoices: ContractInvoice[] = [
    {
      id: 'ci-1',
      contractId: 'contract-1',
      invoiceId: 'invoice-1',
      periodYear: 2024,
      periodMonth: 1,
      generatedAt: new Date(),
      generatedBy: 'user-1',
      invoice: mockInvoice.invoice,
    },
  ];

  let mockGenerateInvoiceFn: ReturnType<typeof vi.fn>;
  let mockFetchContractInvoicesFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateInvoiceFn = vi.fn().mockResolvedValue(mockInvoice);
    mockFetchContractInvoicesFn = vi.fn().mockResolvedValue(mockContractInvoices);
  });

  describe('initial state', () => {
    it('should initialize with current year and month', () => {
      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      expect(result.current.invoicePeriod.year).toBe(currentYear);
      expect(result.current.invoicePeriod.month).toBe(currentMonth);
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice successfully', async () => {
      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const onSuccess = vi.fn();
      const onError = vi.fn();

      await result.current.generateInvoice(mockContract, 2024, 1, onSuccess, onError);

      await waitFor(() => {
        expect(mockGenerateInvoiceFn).toHaveBeenCalledWith('contract-1', 2024, 1);
        expect(mockFetchContractInvoicesFn).toHaveBeenCalledWith('contract-1');
        expect(onSuccess).toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should call onError when generation fails', async () => {
      mockGenerateInvoiceFn.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const onSuccess = vi.fn();
      const onError = vi.fn();

      await result.current.generateInvoice(mockContract, 2024, 1, onSuccess, onError);

      await waitFor(() => {
        expect(mockGenerateInvoiceFn).toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith('Failed to generate invoice');
        expect(onSuccess).not.toHaveBeenCalled();
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should handle errors and call onError', async () => {
      const error = new Error('Network error');
      mockGenerateInvoiceFn.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const onSuccess = vi.fn();
      const onError = vi.fn();

      await result.current.generateInvoice(mockContract, 2024, 1, onSuccess, onError);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error');
        expect(onSuccess).not.toHaveBeenCalled();
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should set isGenerating to true during generation', async () => {
      let resolveGenerate: (value: any) => void;
      const generatePromise = new Promise((resolve) => {
        resolveGenerate = resolve;
      });
      mockGenerateInvoiceFn.mockReturnValue(generatePromise);

      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const generatePromise2 = result.current.generateInvoice(mockContract, 2024, 1);

      // Wait for state update
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      // Resolve the promise
      resolveGenerate!(mockInvoice);
      await generatePromise2;

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should refresh invoices after successful generation', async () => {
      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      await result.current.generateInvoice(mockContract, 2024, 1);

      await waitFor(() => {
        expect(mockFetchContractInvoicesFn).toHaveBeenCalledWith('contract-1');
      });
    });

    it('should not refresh invoices if generation fails', async () => {
      mockGenerateInvoiceFn.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      await result.current.generateInvoice(mockContract, 2024, 1);

      await waitFor(() => {
        expect(mockFetchContractInvoicesFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('setInvoicePeriod', () => {
    it('should update invoice period', async () => {
      const { result } = renderHook(() =>
        useContractInvoiceGeneration(mockGenerateInvoiceFn, mockFetchContractInvoicesFn)
      );

      const newPeriod = { year: 2025, month: 6 };
      result.current.setInvoicePeriod(newPeriod);

      // Wait for state update
      await waitFor(() => {
        expect(result.current.invoicePeriod.year).toBe(newPeriod.year);
        expect(result.current.invoicePeriod.month).toBe(newPeriod.month);
      });
    });
  });
});

