'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { useClients, Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { getClientDisplayName } from '@/lib/utils/accounting';
import { validateSupplierForm } from '@/lib/validations/suppliers';
import { ClientFormData } from '@/components/accounting/ClientForm';
import { getClientType, createEmptyClientFormData, clientToFormData } from '@/lib/utils/clients';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { SupplierAddModal } from '@/components/accounting/SupplierAddModal';
import { SupplierEditModal } from '@/components/accounting/SupplierEditModal';
import { DeleteSupplierDialog } from '@/components/accounting/DeleteSupplierDialog';
import { SuppliersFiltersCard } from '@/components/accounting/SuppliersFiltersCard';
import { SuppliersTableCard } from '@/components/accounting/SuppliersTableCard';

export default function SuppliersPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.SUPPLIERS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('suppliers'));

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();

  const { toasts, success, error: showError, removeToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(createEmptyClientFormData());
  const [clientType, setClientType] = useState<'person' | 'company' | 'organization'>('person');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const refreshClients = useCallback(() => {
    fetchClients({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchClients]);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const handleCreate = useCallback(async () => {
    setFormErrors({});
    const errors = validateSupplierForm(formData, clientType, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createClient({
        ...formData,
        birthDate: formData.birthDate || null,
      });
      if (result) {
        setShowAddModal(false);
        resetForm();
        refreshClients();
        success(t('supplierCreated') || 'Supplier created successfully');
      } else {
        showError(t('errorCreatingSupplier') || 'Failed to create supplier');
      }
    } catch (err) {
      showError(t('errorCreatingSupplier') || 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, clientType, t, createClient, success, showError, refreshClients]);

  const handleUpdate = useCallback(async () => {
    if (!selectedClient) return;

    setFormErrors({});
    const errors = validateSupplierForm(formData, clientType, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateClient(selectedClient.id, {
        ...formData,
        birthDate: formData.birthDate || null,
      });
      if (result) {
        setShowEditModal(false);
        setSelectedClient(null);
        refreshClients();
        success(t('supplierUpdated') || 'Supplier updated successfully');
      } else {
        showError(t('errorUpdatingSupplier') || 'Failed to update supplier');
      }
    } catch (err) {
      showError(t('errorUpdatingSupplier') || 'Failed to update supplier');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClient, formData, clientType, t, updateClient, success, showError, refreshClients]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteClient(id);
    if (result) {
      setDeleteConfirm(null);
      refreshClients();
      success(t('supplierDeleted') || 'Supplier deleted successfully');
    } else {
      showError(t('errorDeletingSupplier') || 'Failed to delete supplier');
    }
  }, [deleteClient, success, showError, t, refreshClients]);

  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setFormData(clientToFormData(client));
    setClientType(getClientType(client));
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createEmptyClientFormData());
    setClientType('person');
    setFormErrors({});
  }, []);

  const handleFieldChange = useCallback((field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [formErrors]);

  const handleClearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const columns = useMemo(() => [
    { key: 'code' as keyof Client, label: t('code'), sortable: true },
    {
      key: 'name' as keyof Client,
      label: t('name'),
      sortable: true,
      render: (_: any, row: Client) => getClientDisplayName(row),
    },
    {
      key: 'type' as keyof Client,
      label: t('type'),
      sortable: false,
      render: (_: any, row: Client) => (
        <Badge variant="secondary" size="sm">
          {getClientType(row)}
        </Badge>
      ),
    },
    { key: 'city' as keyof Client, label: t('city'), sortable: true },
    { key: 'phone' as keyof Client, label: t('phone'), sortable: true },
    {
      key: 'isActive' as keyof Client,
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Client,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Client) => (
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
  ], [t, handleEdit]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('suppliers') },
        ]}
        title={t('suppliers')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('suppliers')}</Button>}
      />

      {/* Filters */}
      <SuppliersFiltersCard
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      {/* Suppliers Table */}
      <SuppliersTableCard
        data={clients}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No suppliers available'}
      />

      {/* Add Modal */}
      <SupplierAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={resetForm}
        formData={formData}
        clientType={clientType}
        formErrors={formErrors}
        onTypeChange={setClientType}
        onFieldChange={handleFieldChange}
        onClearError={handleClearError}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        error={error || null}
      />

      {/* Edit Modal */}
      <SupplierEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
          setFormErrors({});
        }}
        onCancel={() => {
          setSelectedClient(null);
          setFormErrors({});
        }}
        formData={formData}
        clientType={clientType}
        formErrors={formErrors}
        onTypeChange={setClientType}
        onFieldChange={handleFieldChange}
        onClearError={handleClearError}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        error={error || null}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSupplierDialog
        isOpen={!!deleteConfirm}
        supplierId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={loading}
      />
    </div>
  );
}

