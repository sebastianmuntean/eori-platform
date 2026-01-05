'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useDonations, Donation } from '@/hooks/useDonations';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter } from '@/components/ui/FilterGrid';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, getClientDisplayName } from '@/lib/utils/accounting';
import { validateDonationForm, DonationFormData } from '@/lib/validations/donations';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function DonationsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.DONATIONS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('donations'));

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
  const { fetchSummary, summary } = usePayments();
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
  const [formData, setFormData] = useState<DonationFormData>({
    parishId: '',
    paymentNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    amount: '',
    currency: 'RON',
    description: '',
    paymentMethod: '' as 'cash' | 'bank_transfer' | 'card' | 'check' | '',
    referenceNumber: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
  });

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [permissionLoading, fetchParishes, fetchClients]);

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    fetchDonations(params);
    // Fetch summary for donations (using payments API with filters)
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      type: 'income',
    });
  }, [permissionLoading, currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo, fetchDonations, fetchSummary]);

  const handleCreate = useCallback(async () => {
    setFormErrors({});
    const errors = validateDonationForm(formData, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createDonation({
        ...formData,
        amount: parseFloat(formData.amount),
        clientId: formData.clientId || null,
        description: formData.description || null,
        paymentMethod: formData.paymentMethod || null,
        referenceNumber: formData.referenceNumber || null,
      });

      if (result) {
        setShowAddModal(false);
        resetForm();
        success(t('donationCreated') || 'Donation created successfully');
      } else {
        toastError(t('errorCreatingDonation') || 'Failed to create donation');
      }
    } catch (err) {
      toastError(t('errorCreatingDonation') || 'Failed to create donation');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, t, createDonation, success, toastError]);

  const handleUpdate = useCallback(async () => {
    if (!selectedDonation) return;

    setFormErrors({});
    const errors = validateDonationForm(formData, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateDonation(selectedDonation.id, {
        ...formData,
        amount: parseFloat(formData.amount),
        clientId: formData.clientId || null,
        description: formData.description || null,
        paymentMethod: formData.paymentMethod || null,
        referenceNumber: formData.referenceNumber || null,
      });

      if (result) {
        setShowEditModal(false);
        setSelectedDonation(null);
        success(t('donationUpdated') || 'Donation updated successfully');
      } else {
        toastError(t('errorUpdatingDonation') || 'Failed to update donation');
      }
    } catch (err) {
      toastError(t('errorUpdatingDonation') || 'Failed to update donation');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDonation, formData, t, updateDonation, success, toastError]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteDonation(id);
    if (result) {
      setDeleteConfirm(null);
      success(t('donationDeleted') || 'Donation deleted successfully');
    } else {
      toastError(t('errorDeletingDonation') || 'Failed to delete donation');
    }
  }, [deleteDonation, success, toastError, t]);

  const handleEdit = (donation: Donation) => {
    setSelectedDonation(donation);
    setFormData({
      parishId: donation.parishId,
      paymentNumber: donation.paymentNumber,
      date: donation.date,
      clientId: donation.clientId || '',
      amount: donation.amount,
      currency: donation.currency || 'RON',
      description: donation.description || '',
      paymentMethod: donation.paymentMethod || '',
      referenceNumber: donation.referenceNumber || '',
      status: donation.status,
    });
    setShowEditModal(true);
  };

  const resetForm = useCallback(() => {
    setFormData({
      parishId: '',
      paymentNumber: '',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      amount: '',
      currency: 'RON',
      description: '',
      paymentMethod: '',
      referenceNumber: '',
      status: 'pending',
    });
    setFormErrors({});
  }, []);

  const getClientName = useCallback((clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find((c) => c.id === clientId);
    return getClientDisplayName(client);
  }, [clients]);

  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);

  const columns = [
    { key: 'paymentNumber', label: t('paymentNumber'), sortable: true },
    { key: 'date', label: t('date'), sortable: true },
    {
      key: 'clientId',
      label: t('donor'),
      sortable: false,
      render: (value: string | null) => getClientName(value),
    },
    {
      key: 'amount',
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Donation) => formatCurrency(value, row.currency),
    },
    {
      key: 'paymentMethod',
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
      key: 'status',
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
      key: 'actions',
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
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('donations') },
  ];

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('donations')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('donation')}</Button>
      </div>

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
              <Table data={donations} columns={columns} loading={loading} />
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
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCancel={() => setShowAddModal(false)}
        title={`${t('add')} ${t('donation')}`}
        onSubmit={handleCreate}
        isSubmitting={false}
        submitLabel={t('create')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-6">
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
              <label className="block text-sm font-medium mb-1">{t('donor')}</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">{t('none')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="">{t('none')}</option>
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
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCancel={() => setShowEditModal(false)}
        title={`${t('edit')} ${t('donation')}`}
        onSubmit={handleUpdate}
        isSubmitting={false}
        submitLabel={t('update')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-6">
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
              <label className="block text-sm font-medium mb-1">{t('donor')}</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">{t('none')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="">{t('none')}</option>
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
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDeleteMessage') || 'Are you sure you want to delete this donation?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}

