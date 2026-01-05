'use client';

import { useState, useCallback } from 'react';
import { Client } from './useClients';
import { Invoice } from './useInvoices';
import { Payment } from './usePayments';

export interface ClientStatementSummary {
  issuedInvoices: number;
  receivedInvoices: number;
  paymentsReceived: number;
  paymentsMade: number;
  balance: number;
  issuedInvoicesCount: number;
  receivedInvoicesCount: number;
  paymentsReceivedCount: number;
  paymentsMadeCount: number;
}

export interface ClientStatement {
  client: Client;
  summary: ClientStatementSummary;
  invoices: Invoice[];
  payments: Payment[];
}

interface UseClientStatementReturn {
  statement: ClientStatement | null;
  loading: boolean;
  error: string | null;
  fetchStatement: (params?: {
    clientId?: string;
    partnerId?: string; // @deprecated Use clientId instead
    dateFrom?: string;
    dateTo?: string;
    invoiceType?: 'issued' | 'received';
    invoiceStatus?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    paymentType?: 'income' | 'expense';
  }) => Promise<void>;
  refreshStatement: () => Promise<void>;
}

export function useClientStatement(): UseClientStatementReturn {
  const [statement, setStatement] = useState<ClientStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<Parameters<UseClientStatementReturn['fetchStatement']>[0] | null>(null);

  const fetchStatement = useCallback(async (params?: {
    clientId?: string;
    partnerId?: string; // @deprecated Use clientId instead
    dateFrom?: string;
    dateTo?: string;
    invoiceType?: 'issued' | 'received';
    invoiceStatus?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    paymentType?: 'income' | 'expense';
  }) => {
    // Support both clientId and partnerId for backward compatibility
    const id = params?.clientId || params?.partnerId;
    
    if (!id) {
      setError('Client ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.invoiceType) queryParams.append('invoiceType', params.invoiceType);
      if (params?.invoiceStatus) queryParams.append('invoiceStatus', params.invoiceStatus);
      if (params?.paymentType) queryParams.append('paymentType', params.paymentType);

      const response = await fetch(`/api/clients/${id}/statement?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch client statement');
      }

      setStatement(result.data);
      setLastParams(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client statement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatement = useCallback(async () => {
    if (lastParams) {
      await fetchStatement(lastParams);
    }
  }, [lastParams, fetchStatement]);

  return {
    statement,
    loading,
    error,
    fetchStatement,
    refreshStatement,
  };
}



