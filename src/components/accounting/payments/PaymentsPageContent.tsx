'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { getClientName as getClientNameHelper } from '@/lib/utils/client-helpers';
import { formatCurrency, getStatusVariant, getTypeVariant, getPaymentMethodLabel } from '@/lib/utils/paymentUtils';
import { usePaymentForm } from '@/hooks/usePaymentForm';
import { useQuickPayment, PaymentFilters } from '@/hooks/useQuickPayment';
import { PaymentAddModal } from '@/components/accounting/payments/PaymentAddModal';
import { PaymentEditModal } from '@/components/accounting/payments/PaymentEditModal';
import { DeletePaymentDialog } from '@/components/accounting/payments/DeletePaymentDialog';
import { PaymentsFiltersCard } from '@/components/accounting/payments/PaymentsFiltersCard';
import { PaymentsTableCard } from '@/components/accounting/payments/PaymentsTableCard';
import { QuickPaymentModal } from '@/components/accounting/payments/QuickPaymentModal';

interface PaymentsPageContentProps {
  locale: string;
}

const PAGE_SIZE = 10;
const DEFAULT_SORT_BY = 'date';
const DEFAULT_SORT_ORDER = 'desc';

/**
 * Payments page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function PaymentsPageContent({ locale }: PaymentsPageContentProps) {
  const searchParams = useSearchParams();
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

  const {
    formData,
    resetForm,
    updateFormData,
    loadPayment,
    validateForm,
    toCreateData,
  } = usePaymentForm();

  // Build filter object for quick payment hook
  const paymentFilters: PaymentFilters = useMemo(
    () => ({
      currentPage,
      searchTerm,
      parishFilter,
      typeFilter,
      statusFilter,
      categoryFilter,
      dateFrom,
      dateTo,
    }),
    [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo]
  );

  const {
    quickPaymentForm,
    setQuickPaymentForm,
    quickPaymentLoading,
    resetQuickPaymentForm,
    preselectUserParish,
    handleClientSearch,
    handleQuickPaymentSubmit,
  } = useQuickPayment({
    filters: paymentFilters,
    onSuccess: () => {
      setShowQuickPaymentModal(false);
    },
  });

  // Fetch parishes on mount
  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  // Check if quick payment modal should open from URL parameter
  useEffect(() => {
    const quickParam = searchParams.get('quick');
    if (quickParam === 'true' && !showQuickPaymentModal) {
      setShowQuickPaymentModal(true);
      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('quick');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, showQuickPaymentModal]);

  // Preselect user's parish when opening quick payment modal
  useEffect(() => {
    if (showQuickPaymentModal) {
      preselectUserParish(parishes);
    }
  }, [showQuickPaymentModal, parishes, preselectUserParish]);

  // Lazy load clients only when quick payment modal opens
  useEffect(() => {
    if (showQuickPaymentModal && clients.length === 0) {
      fetchClients({ all: true });
    }
  }, [showQuickPaymentModal, clients.length, fetchClients]);

  // Build fetch parameters from filters
  const paymentFetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: (typeFilter === 'income' || typeFilter === 'expense' ? typeFilter : undefined) as 'income' | 'expense' | undefined,
      status: (statusFilter === 'pending' || statusFilter === 'completed' || statusFilter === 'cancelled' ? statusFilter : undefined) as 'pending' | 'completed' | 'cancelled' | undefined,
      category: categoryFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
    }),
    [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, categoryFilter, dateFrom, dateTo]
  );

  // Build summary fetch parameters
  const summaryFetchParams = useMemo(
    () => ({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [parishFilter, dateFrom, dateTo]
  );

  // Fetch payments when filters or page changes
  useEffect(() => {
    fetchPayments(paymentFetchParams);
  }, [paymentFetchParams, fetchPayments]);

  // Fetch summary when relevant filters change
  useEffect(() => {
    fetchSummary(summaryFetchParams);
  }, [summaryFetchParams, fetchSummary]);

  const handleCreate = useCallback(async () => {
    const validation = validateForm(t);
    if (!validation.valid) {
      showError(validation.error || t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const paymentData = toCreateData();
    const result = await createPayment(paymentData);

    if (result) {
      setShowAddModal(false);
      resetForm();
      showSuccess(t('paymentCreated') || 'Payment created successfully');
    } else {
      showError(t('paymentCreationFailed') || 'Failed to create payment');
    }
  }, [validateForm, toCreateData, createPayment, resetForm, showSuccess, showError, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedPayment) return;

    const validation = validateForm(t);
    if (!validation.valid) {
      showError(validation.error || t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const paymentData = toCreateData();
    const result = await updatePayment(selectedPayment.id, paymentData);

    if (result) {
      setShowEditModal(false);
      setSelectedPayment(null);
      showSuccess(t('paymentUpdated') || 'Payment updated successfully');
    } else {
      showError(t('paymentUpdateFailed') || 'Failed to update payment');
    }
  }, [selectedPayment, validateForm, toCreateData, updatePayment, showSuccess, showError, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deletePayment(id);
      if (result) {
        setDeleteConfirm(null);
      }
    },
    [deletePayment]
  );

  const handleEdit = useCallback(
    (payment: Payment) => {
      setSelectedPayment(payment);
      loadPayment(payment);
      setShowEditModal(true);
    },
    [loadPayment]
  );

  const getClientNameById = useCallback(
    (clientId: string | null) => {
      if (!clientId) return '-';
      const client = clients.find((c) => c.id === clientId);
      if (!client) return clientId;
      return getClientNameHelper(client);
    },
    [clients]
  );

  const columns = useMemo(
    () => [
      { key: 'paymentNumber' as keyof Payment, label: t('paymentNumber'), sortable: true },
      { key: 'date' as keyof Payment, label: t('date'), sortable: true },
      {
        key: 'type' as keyof Payment,
        label: t('paymentType'),
        sortable: false,
        render: (value: 'income' | 'expense') => (
          <Badge variant={getTypeVariant(value)} size="sm">
            {value === 'income' ? t('income') : t('expense')}
          </Badge>
        ),
      },
      {
        key: 'category' as keyof Payment,
        label: t('category'),
        sortable: false,
        render: (value: string | null) => value || '-',
      },
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
        render: (value: string | null) => getPaymentMethodLabel(value as any, t),
      },
      {
        key: 'status' as keyof Payment,
        label: t('status'),
        sortable: false,
        render: (value: 'pending' | 'completed' | 'cancelled') => (
          <Badge variant={getStatusVariant(value)} size="sm">
            {t(value)}
          </Badge>
        ),
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
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
    ],
    [t, getClientNameById, handleEdit]
  );

  // Filter handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  const handleCloseQuickPaymentModal = useCallback(() => {
    setShowQuickPaymentModal(false);
    resetQuickPaymentForm();
  }, [resetQuickPaymentForm]);

  const handleQuickPaymentSubmitWrapper = useCallback(async () => {
    await handleQuickPaymentSubmit(t);
  }, [handleQuickPaymentSubmit, t]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('payments') },
        ]}
        title={t('payments')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQuickPaymentModal(true)}>
              {t('quickPayment') || 'Incasare rapida'}
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              {t('add')} {t('payment')}
            </Button>
          </div>
        }
      />

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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <PaymentsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        onSearchChange={handleSearchChange}
        onParishFilterChange={handleParishFilterChange}
        onTypeFilterChange={handleTypeFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClear={handleClearFilters}
      />

      {/* Payments Table */}
      <PaymentsTableCard
        data={payments}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No payments available'}
      />

      {/* Add Modal */}
      <PaymentAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={updateFormData}
        parishes={parishes}
        clients={clients}
        onSubmit={handleCreate}
        isSubmitting={false}
      />

      {/* Edit Modal */}
      <PaymentEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPayment(null);
          resetForm();
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedPayment(null);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={updateFormData}
        parishes={parishes}
        clients={clients}
        onSubmit={handleUpdate}
        isSubmitting={false}
      />

      {/* Quick Payment Modal */}
      <QuickPaymentModal
        isOpen={showQuickPaymentModal}
        onClose={handleCloseQuickPaymentModal}
        onCancel={handleCloseQuickPaymentModal}
        formData={quickPaymentForm}
        onFormDataChange={setQuickPaymentForm}
        parishes={parishes}
        clients={clients}
        clientsLoading={clientsLoading}
        onSubmit={handleQuickPaymentSubmitWrapper}
        isSubmitting={quickPaymentLoading}
        onClientSearch={handleClientSearch}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePaymentDialog
        isOpen={!!deleteConfirm}
        paymentId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}

