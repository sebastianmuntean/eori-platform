'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { DonationAddModal } from '@/components/accounting/DonationAddModal';
import { DonationFormData } from '@/lib/validations/donations';
import { DonationEditModal } from '@/components/accounting/DonationEditModal';
import { DeleteDonationDialog } from '@/components/accounting/DeleteDonationDialog';
import { DonationsFiltersCard } from '@/components/accounting/DonationsFiltersCard';
import { DonationsTableCard } from '@/components/accounting/DonationsTableCard';
import { useDonations, Donation } from '@/hooks/useDonations';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, getClientDisplayName } from '@/lib/utils/accounting';
import { validateDonationForm } from '@/lib/validations/donations';
import {
  createEmptyDonationFormData,
  donationToFormData,
} from '@/lib/utils/donations';

const PAGE_SIZE = 10;

// Payment method translation map
const PAYMENT_METHOD_MAP: Record<string, string> = {
  cash: 'cash',
  bank_transfer: 'bankTransfer',
  card: 'card',
  check: 'check',
};

// Status badge variant map
const STATUS_VARIANT_MAP: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

interface DonationsPageContentProps {
  locale: string;
}

/**
 * Donations page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function DonationsPageContent({ locale }: DonationsPageContentProps) {
  const t = useTranslations('common');

  // All hooks must be called before any conditional returns
  const {
    donations,
    loading,
    error,
    pagination,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  } = useDonations();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();
  const { fetchSummary } = usePayments();
  const { toasts, success, error: toastError, removeToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DonationFormData>(createEmptyDonationFormData());

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      status: (statusFilter || undefined) as 'pending' | 'completed' | 'cancelled' | undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo]
  );

  // Fetch donations when filters or page changes
  useEffect(() => {
    fetchDonations(fetchParams);
    // Fetch summary for donations (using payments API with filters)
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      type: 'income',
    });
  }, [fetchParams, parishFilter, dateFrom, dateTo, fetchDonations, fetchSummary]);

  /**
   * Handles form submission errors
   * Sets form errors for amount-related errors, otherwise shows toast
   */
  const handleFormError = useCallback(
    (err: unknown, defaultMessage: string) => {
      const errorMessage = err instanceof Error ? err.message : defaultMessage;
      if (errorMessage.includes('amount') || errorMessage.includes('invalid')) {
        setFormErrors({ amount: errorMessage });
      } else {
        toastError(errorMessage);
      }
    },
    [toastError]
  );

  /**
   * Validates form data and sets errors if any
   * Returns true if validation passes, false otherwise
   */
  const validateAndSetErrors = useCallback((data: DonationFormData): boolean => {
    setFormErrors({});
    const errors = validateDonationForm(data, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }
    return true;
  }, [t]);

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData(createEmptyDonationFormData());
    setFormErrors({});
  }, []);

  // Prepare donation data for API
  const prepareDonationData = useCallback((data: DonationFormData) => {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(t('invalidAmount') || 'Please enter a valid amount');
    }

    return {
      ...data,
      amount,
      clientId: data.clientId || null,
      description: data.description || null,
      paymentMethod: data.paymentMethod || null,
      referenceNumber: data.referenceNumber || null,
    };
  }, [t]);

  // Validate and create donation
  const handleCreate = useCallback(async () => {
    if (!validateAndSetErrors(formData)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedData = prepareDonationData(formData);
      const result = await createDonation(normalizedData);

      if (result) {
        setShowAddModal(false);
        resetForm();
        success(t('donationCreated') || 'Donation created successfully');
      } else {
        toastError(t('errorCreatingDonation') || 'Failed to create donation');
      }
    } catch (err) {
      handleFormError(err, t('errorCreatingDonation') || 'Failed to create donation');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, t, createDonation, success, toastError, validateAndSetErrors, prepareDonationData, resetForm, handleFormError]);

  // Validate and update donation
  const handleUpdate = useCallback(async () => {
    if (!selectedDonation || !validateAndSetErrors(formData)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedData = prepareDonationData(formData);
      const result = await updateDonation(selectedDonation.id, normalizedData);

      if (result) {
        setShowEditModal(false);
        setSelectedDonation(null);
        setFormErrors({});
        success(t('donationUpdated') || 'Donation updated successfully');
      } else {
        toastError(t('errorUpdatingDonation') || 'Failed to update donation');
      }
    } catch (err) {
      handleFormError(err, t('errorUpdatingDonation') || 'Failed to update donation');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDonation, formData, t, updateDonation, success, toastError, validateAndSetErrors, prepareDonationData, handleFormError]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteDonation(id);
    if (result) {
      setDeleteConfirm(null);
      success(t('donationDeleted') || 'Donation deleted successfully');
    } else {
      toastError(t('errorDeletingDonation') || 'Failed to delete donation');
    }
  }, [deleteDonation, success, toastError, t]);

  // Open edit modal with donation data
  const handleEdit = useCallback((donation: Donation) => {
    setSelectedDonation(donation);
    setFormData(donationToFormData(donation));
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  const getClientName = useCallback((clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find((c) => c.id === clientId);
    return getClientDisplayName(client);
  }, [clients]);

  // Filter handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
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

  // Clear all filters and reset to first page
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  // Calculate total donations (memoized for performance)
  const totalDonations = useMemo(
    () => donations.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0),
    [donations]
  );

  const columns: Column<Donation>[] = useMemo(() => [
    { key: 'paymentNumber' as keyof Donation, label: t('paymentNumber'), sortable: true },
    { key: 'date' as keyof Donation, label: t('date'), sortable: true },
    {
      key: 'clientId' as keyof Donation,
      label: t('donor'),
      sortable: false,
      render: (value: string | null) => getClientName(value),
    },
    {
      key: 'amount' as keyof Donation,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Donation) => formatCurrency(value, row.currency),
    },
    {
      key: 'paymentMethod' as keyof Donation,
      label: t('paymentMethod'),
      sortable: false,
      render: (value: string | null) => {
        if (!value) return '-';
        const translationKey = PAYMENT_METHOD_MAP[value];
        return translationKey ? t(translationKey) : value;
      },
    },
    {
      key: 'status' as keyof Donation,
      label: t('status'),
      sortable: false,
      render: (value: 'pending' | 'completed' | 'cancelled') => {
        return (
          <Badge variant={STATUS_VARIANT_MAP[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'actions' as keyof Donation,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Donation) => (
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
  ], [t, getClientName, handleEdit]);

  // Close add modal and reset form
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedDonation(null);
    setFormErrors({});
  }, []);

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('donations') },
        ]}
        title={t('donations')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('donation')}</Button>}
      />

      {/* Summary Card */}
      <div className="mb-6">
        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('totalDonations')}</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalDonations)}</p>
              </div>
              <div className="text-success">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <DonationsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        onSearchChange={handleSearchChange}
        onParishFilterChange={handleParishFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <DonationsTableCard
        data={donations}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No donations available'}
      />

      {/* Add Modal */}
      <DonationAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        clients={clients}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
      />

      {/* Edit Modal */}
      <DonationEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        clients={clients}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDonationDialog
        isOpen={!!deleteConfirm}
        donationId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={loading}
      />
    </PageContainer>
  );
}

