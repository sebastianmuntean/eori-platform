'use client';

import { useState, useCallback } from 'react';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vat?: number;
  total: number;
}

export interface Invoice {
  id: string;
  parishId: string;
  series: string;
  number: string;
  invoiceNumber: string;
  type: 'issued' | 'received';
  date: string;
  dueDate: string;
  clientId: string;
  amount: string;
  vat: string;
  total: string;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentDate: string | null;
  description: string | null;
  items: InvoiceItem[];
  warehouseId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

interface InvoiceSummary {
  totalIssued: number;
  totalReceived: number;
  unpaidCount: number;
  overdueCount: number;
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  summary: InvoiceSummary | null;
  fetchInvoices: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: 'issued' | 'received';
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  fetchSummary: (params?: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<void>;
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  markAsPaid: (id: string) => Promise<Invoice | null>;
}

export function useInvoices(): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseInvoicesReturn['pagination']>(null);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);

  const fetchInvoices = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: 'issued' | 'received';
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.clientId) queryParams.append('clientId', params.clientId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/invoices?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoices');
      }

      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (params: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    try {
      // Calculate summary from invoices list
      // For now, we'll calculate it from the fetched invoices
      // In a real app, you might want a dedicated summary endpoint
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await fetch(`/api/accounting/invoices?${queryParams.toString()}&pageSize=1000`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoices for summary');
      }

      const allInvoices = result.data;
      const totalIssued = allInvoices
        .filter((inv: Invoice) => inv.type === 'issued')
        .reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.total || '0'), 0);
      
      const totalReceived = allInvoices
        .filter((inv: Invoice) => inv.type === 'received')
        .reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.total || '0'), 0);
      
      const unpaidCount = allInvoices.filter((inv: Invoice) => inv.status !== 'paid').length;
      
      const today = new Date().toISOString().split('T')[0];
      const overdueCount = allInvoices.filter(
        (inv: Invoice) => inv.status !== 'paid' && inv.dueDate < today
      ).length;

      setSummary({
        totalIssued,
        totalReceived,
        unpaidCount,
        overdueCount,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch summary';
      setError(errorMessage);
    }
  }, []);

  const createInvoice = useCallback(async (data: Partial<Invoice>): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }

      // Refresh invoices list
      await fetchInvoices();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update invoice');
      }

      // Refresh invoices list
      await fetchInvoices();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/invoices/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete invoice');
      }

      // Refresh invoices list
      await fetchInvoices();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  const markAsPaid = useCallback(async (id: string): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/invoices/${id}/mark-paid`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark invoice as paid');
      }

      // Refresh invoices list
      await fetchInvoices();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invoice as paid';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    pagination,
    summary,
    fetchInvoices,
    fetchSummary,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
  };
}

