'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useParishes } from '@/hooks/useParishes';
import { useClients, Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter } from '@/components/ui/FilterGrid';
import { Autocomplete, AutocompleteOption } from '@/components/ui/Autocomplete';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { getClientDisplayName, getClientName as getClientNameHelper } from '@/lib/utils/client-helpers';

export default function PaymentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    payments,
    loading,
    error,
    pagination,
    summary,
    fetchPayments,
    fetchSummary,
    createPayment,
    updatePayment,
    deletePayment,
  } = usePayments();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients, loading: clientsLoading } = useClients();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [quickPaymentForm, setQuickPaymentForm] = useState({
    parishId: '',
    clientId: '',
    clientDisplayName: '',
    amount: '',
    reason: '',
  });
  const [quickPaymentLoading, setQuickPaymentLoading] = useState(false);
  const [formData, setFormData] = useState({
    parishId: '',
    paymentNumber: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income' as 'income' | 'expense',
    category: '',
    clientId: '',
    amount: '',
    currency: 'RON',
    description: '',
    paymentMethod: '' as 'cash' | 'bank_transfer' | 'card' | 'check' | '',
    referenceNumber: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
  });

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  // Lazy load clients only when quick payment modal opens
  useEffect(() => {
    if (showQuickPaymentModal && clients.length === 0) {
      fetchClients({ all: true });
    }
  }, [showQuickPaymentModal, clients.length, fetchClients]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    fetchPayments(params);
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, fetchPayments, fetchSummary]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.paymentNumber || !formData.date || !formData.amount) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await createPayment({
      ...formData,
      amount: parseFloat(formData.amount) as any,
      category: formData.category || null,
      clientId: formData.clientId || null,
      description: formData.description || null,
      paymentMethod: formData.paymentMethod || null,
      referenceNumber: formData.referenceNumber || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedPayment) return;

    if (!formData.parishId || !formData.paymentNumber || !formData.date || !formData.amount) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await updatePayment(selectedPayment.id, {
      ...formData,
      amount: parseFloat(formData.amount) as any,
      category: formData.category || null,
      clientId: formData.clientId || null,
      description: formData.description || null,
      paymentMethod: formData.paymentMethod || null,
      referenceNumber: formData.referenceNumber || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedPayment(null);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deletePayment(id);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      parishId: payment.parishId,
      paymentNumber: payment.paymentNumber,
      date: payment.date,
      type: payment.type,
      category: payment.category || '',
      clientId: payment.clientId || '',
      amount: payment.amount,
      currency: payment.currency || 'RON',
      description: payment.description || '',
      paymentMethod: payment.paymentMethod || '',
      referenceNumber: payment.referenceNumber || '',
      status: payment.status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      paymentNumber: '',
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: '',
      clientId: '',
      amount: '',
      currency: 'RON',
      description: '',
      paymentMethod: '',
      referenceNumber: '',
      status: 'pending',
    });
  };

  const resetQuickPaymentForm = () => {
    setQuickPaymentForm({
      parishId: '',
      clientId: '',
      clientDisplayName: '',
      amount: '',
      reason: '',
    });
  };

  // Create client options for autocomplete (only active clients)
  const clientOptions: AutocompleteOption[] = clients
    .filter((client) => client.isActive)
    .map((client) => ({
      value: client.id,
      label: getClientDisplayName(client),
      client,
    }))
    .sort((a, b) => {
      const nameA = getClientNameHelper(a.client);
      const nameB = getClientNameHelper(b.client);
      return nameA.localeCompare(nameB, 'ro', { sensitivity: 'base' });
    });

  // Debounce search for clients
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleClientSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchTerm && searchTerm.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchClients({
          search: searchTerm,
          pageSize: 50,
        });
      }, 300);
    }
  }, [fetchClients]);

  const handleQuickPaymentSubmit = async () => {
    // Validate required fields
    if (!quickPaymentForm.parishId || !quickPaymentForm.clientId || !quickPaymentForm.amount || !quickPaymentForm.reason.trim()) {
      showError(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    // Validate client is selected (not just display name)
    if (!quickPaymentForm.clientId) {
      showError(t('selectClient') || 'Please select a valid client');
      return;
    }

    // Validate and parse amount
    const amount = parseFloat(quickPaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showError(t('invalidAmount') || 'Invalid amount');
      return;
    }

    if (amount > 999999999.99) {
      showError(t('amountTooLarge') || 'Amount exceeds maximum allowed');
      return;
    }

    setQuickPaymentLoading(true);
    try {
      const response = await fetch('/api/accounting/payments/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parishId: quickPaymentForm.parishId,
          clientId: quickPaymentForm.clientId,
          amount: amount,
          reason: quickPaymentForm.reason.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Success - close modal, reset form, refresh payments
      setShowQuickPaymentModal(false);
      resetQuickPaymentForm();
      
      // Refresh payments list
      await fetchPayments({
        page: currentPage,
        pageSize: 10,
        search: searchTerm || undefined,
        parishId: parishFilter || undefined,
        type: typeFilter as 'income' | 'expense' | undefined,
        status: statusFilter as 'pending' | 'completed' | 'cancelled' | undefined,
        category: categoryFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'date',
        sortOrder: 'desc',
      });
      
      await fetchSummary({
        parishId: parishFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      
      showSuccess(t('paymentCreated') || 'Payment created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      showError(errorMessage);
    } finally {
      setQuickPaymentLoading(false);
    }
  };

  const formatCurrency = (amount: string | number, currency: string = 'RON') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
  };

  const getParishName = (parishId: string) => {
    const parish = parishes.find((p) => p.id === parishId);
    return parish ? parish.name : parishId;
  };

  const getClientNameById = (clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find((c) => c.id === clientId);
    if (!client) return clientId;
    return getClientNameHelper(client);
  };

  const columns = [
    { key: 'paymentNumber' as keyof Payment, label: t('paymentNumber'), sortable: true },
    { key: 'date' as keyof Payment, label: t('date'), sortable: true },
    {
      key: 'type' as keyof Payment,
      label: t('paymentType'),
      sortable: false,
      render: (value: 'income' | 'expense') => (
        <Badge variant={value === 'income' ? 'success' : 'danger'} size="sm">
          {value === 'income' ? t('income') : t('expense')}
        </Badge>
      ),
    },
    { key: 'category' as keyof Payment, label: t('category'), sortable: false, render: (value: string | null) => value || '-' },
    {
      key: 'clientId' as keyof Payment,
      label: t('parteneri'),
      sortable: false,
      render: (value: string | null) => getClientNameById(value),
    },
    {
      key: 'amount' as keyof Payment,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Payment) => formatCurrency(value, row.currency),
    },
    {
      key: 'paymentMethod' as keyof Payment,
      label: t('paymentMethod'),
      sortable: false,
      render: (value: string | null) => {
        if (!value) return '-';
        const methodMap: Record<string, string> = {
          cash: t('cash'),
          bank_transfer: t('bankTransfer'),
          card: t('card'),
          check: t('check'),
        };
        return methodMap[value] || value;
      },
    },
    {
      key: 'status' as keyof Payment,
      label: t('status'),
      sortable: false,
      render: (value: 'pending' | 'completed' | 'cancelled') => {
        const variantMap: Record<string, 'warning' | 'success' | 'danger'> = {
          pending: 'warning',
          completed: 'success',
          cancelled: 'danger',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'id' as keyof Payment,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Payment) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => handleEdit(row) },
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('payments') },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('payments')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQuickPaymentModal(true)}>
            {t('quickPayment') || 'Incasare rapida'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('payment')}</Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('totalIncome')}</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="text-success">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('totalExpense')}</p>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(summary.totalExpense)}</p>
                </div>
                <div className="text-danger">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('net')}</p>
                  <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(summary.net)}
                  </p>
                </div>
                <div className={summary.net >= 0 ? 'text-success' : 'text-danger'}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder={t('search') + '...'}
            />
          </div>
          <FilterGrid>
            <ParishFilter
              value={parishFilter}
              onChange={(value) => {
                setParishFilter(value);
                setCurrentPage(1);
              }}
              parishes={parishes}
            />
            <TypeFilter
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              types={[
                { value: 'income', label: t('income') },
                { value: 'expense', label: t('expense') },
              ]}
            />
            <StatusFilter
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              statuses={[
                { value: 'pending', label: t('pending') },
                { value: 'completed', label: t('completed') },
                { value: 'cancelled', label: t('cancelled') },
              ]}
            />
            <FilterDate
              label={t('dateFrom')}
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value);
                setCurrentPage(1);
              }}
            />
            <FilterDate
              label={t('dateTo')}
              value={dateTo}
              onChange={(value) => {
                setDateTo(value);
                setCurrentPage(1);
              }}
            />
            <FilterClear
              onClear={() => {
                setSearchTerm('');
                setParishFilter('');
                setTypeFilter('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
            />
          </FilterGrid>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading')}</div>
          ) : (
            <>
              <Table data={payments} columns={columns} />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages} ({pagination.total} {t('total')})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`${t('add')} ${t('payment')}`} size="full">
        <div className="space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
              <select
                value={formData.parishId}
                onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">{t('selectParish')}</option>
                {parishes.map((parish) => (
                  <option key={parish.id} value={parish.id}>
                    {parish.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={`${t('paymentNumber')} *`}
              value={formData.paymentNumber}
              onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
              required
            />
            <Input
              type="date"
              label={`${t('date')} *`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('paymentType')} *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
            <Input label={t('category')} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <ClientSelect
              value={formData.clientId}
              onChange={(value) => setFormData({ ...formData, clientId: value })}
              clients={clients}
              onlyCompanies={false}
              label={t('parteneri')}
              placeholder={t('none') || 'None'}
            />
            <Input
              type="number"
              step="0.01"
              label={`${t('amount')} *`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">{t('paymentMethod')}</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">{t('none') || 'None'}</option>
                <option value="cash">{t('cash')}</option>
                <option value="bank_transfer">{t('bankTransfer')}</option>
                <option value="card">{t('card')}</option>
                <option value="check">{t('check')}</option>
              </select>
            </div>
            <Input
              label={t('referenceNumber')}
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="pending">{t('pending')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal - same structure as Add Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`${t('edit')} ${t('payment')}`} size="full">
        <div className="space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
              <select
                value={formData.parishId}
                onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">{t('selectParish')}</option>
                {parishes.map((parish) => (
                  <option key={parish.id} value={parish.id}>
                    {parish.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={`${t('paymentNumber')} *`}
              value={formData.paymentNumber}
              onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
              required
            />
            <Input
              type="date"
              label={`${t('date')} *`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('paymentType')} *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
            <Input label={t('category')} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <ClientSelect
              value={formData.clientId}
              onChange={(value) => setFormData({ ...formData, clientId: value })}
              clients={clients}
              onlyCompanies={false}
              label={t('parteneri')}
              placeholder={t('none') || 'None'}
            />
            <Input
              type="number"
              step="0.01"
              label={`${t('amount')} *`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">{t('paymentMethod')}</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">{t('none') || 'None'}</option>
                <option value="cash">{t('cash')}</option>
                <option value="bank_transfer">{t('bankTransfer')}</option>
                <option value="card">{t('card')}</option>
                <option value="check">{t('check')}</option>
              </select>
            </div>
            <Input
              label={t('referenceNumber')}
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="pending">{t('pending')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('update')}</Button>
          </div>
        </div>
      </Modal>

      {/* Quick Payment Modal */}
      <Modal 
        isOpen={showQuickPaymentModal} 
        onClose={() => {
          setShowQuickPaymentModal(false);
          resetQuickPaymentForm();
        }} 
        title={t('quickPayment') || 'Incasare rapida'} 
        size="full"
      >
        <div className="space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
              <select
                value={quickPaymentForm.parishId}
                onChange={(e) => setQuickPaymentForm({ ...quickPaymentForm, parishId: e.target.value })}
                className="w-full px-3 py-2 border rounded text-base"
                required
              >
                <option value="">{t('selectParish') || 'Select Parish'}</option>
                {parishes.map((parish) => (
                  <option key={parish.id} value={parish.id}>
                    {parish.name}
                  </option>
                ))}
              </select>
            </div>

            <Autocomplete
              label={`${t('client') || 'Client'} *`}
              value={quickPaymentForm.clientDisplayName}
              onChange={(value) => {
                // Update display name
                setQuickPaymentForm(prev => ({ ...prev, clientDisplayName: value }));
                
                // Find and set client ID by matching label
                const selectedOption = clientOptions.find(opt => opt.label === value);
                if (selectedOption) {
                  setQuickPaymentForm(prev => ({ ...prev, clientId: selectedOption.value }));
                } else {
                  // Clear client ID if no match (user typing)
                  setQuickPaymentForm(prev => ({ ...prev, clientId: '' }));
                }
              }}
              options={clientOptions}
              placeholder={t('searchClient') || 'Search client...'}
              onSearch={handleClientSearch}
              loading={clientsLoading}
              getOptionLabel={(option) => option.label}
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('amount')} *`}
              value={quickPaymentForm.amount}
              onChange={(e) => setQuickPaymentForm({ ...quickPaymentForm, amount: e.target.value })}
              required
              className="text-base"
            />

            <div>
              <label className="block text-sm font-medium mb-1">{t('reason') || 'Motiv'} *</label>
              <textarea
                value={quickPaymentForm.reason}
                onChange={(e) => setQuickPaymentForm({ ...quickPaymentForm, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded text-base min-h-[100px]"
                placeholder={t('enterReason') || 'Enter payment reason...'}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowQuickPaymentModal(false);
                resetQuickPaymentForm();
              }}
              disabled={quickPaymentLoading}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleQuickPaymentSubmit}
              disabled={quickPaymentLoading}
            >
              {quickPaymentLoading ? (t('creating') || 'Creating...') : (t('create') || 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('confirmDelete')}>
          <div className="space-y-4">
            <p>{t('confirmDelete')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                {t('delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

