'use client';

import { useState, useCallback } from 'react';
import { Contract, ContractInvoice } from './useContracts';

interface UseContractInvoiceGenerationReturn {
  invoicePeriod: { year: number; month: number };
  setInvoicePeriod: (period: { year: number; month: number }) => void;
  generateInvoice: (
    contract: Contract,
    periodYear: number,
    periodMonth: number,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => Promise<void>;
  isGenerating: boolean;
}

/**
 * Hook for managing contract invoice generation
 * Extracts invoice generation logic from the contracts page
 */
export function useContractInvoiceGeneration(
  generateInvoiceFn: (contractId: string, periodYear: number, periodMonth: number) => Promise<{ invoice: any; contractInvoice: any } | null>,
  fetchContractInvoicesFn: (contractId: string) => Promise<ContractInvoice[]>
): UseContractInvoiceGenerationReturn {
  const [invoicePeriod, setInvoicePeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = useCallback(
    async (
      contract: Contract,
      periodYear: number,
      periodMonth: number,
      onSuccess?: () => void,
      onError?: (error: string) => void
    ) => {
      setIsGenerating(true);
      try {
        const result = await generateInvoiceFn(contract.id, periodYear, periodMonth);
        if (result) {
          // Refresh invoices after successful generation
          await fetchContractInvoicesFn(contract.id);
          onSuccess?.();
        } else {
          onError?.('Failed to generate invoice');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice';
        onError?.(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [generateInvoiceFn, fetchContractInvoicesFn]
  );

  return {
    invoicePeriod,
    setInvoicePeriod,
    generateInvoice,
    isGenerating,
  };
}


