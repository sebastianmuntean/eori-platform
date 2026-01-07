'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { useClients, Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { validateSupplierForm } from '@/lib/validations/suppliers';
import { ClientFormData } from '@/components/accounting/ClientForm';
import { getClientType, createEmptyClientFormData, clientToFormData } from '@/lib/utils/clients';
import { SupplierAddModal } from './SupplierAddModal';
import { SupplierEditModal } from './SupplierEditModal';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { SuppliersFiltersCard } from './SuppliersFiltersCard';
import { SuppliersTableCard } from './SuppliersTableCard';
import { getSuppliersTableColumns } from './SuppliersTableColumns';

const PAGE_SIZE = 10;

interface SuppliersPageContentProps {
  locale: string;
}

/**
 * Suppliers page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function SuppliersPageContent({ locale }: SuppliersPageContentProps) {
  const t = useTranslations('common');

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

  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      sortBy: 'code' as const,
      sortOrder: 'asc' as const,
    }),
    [currentPage, searchTerm]
  );

  // Fetch clients when filters or page changes
  useEffect(() => {
    fetchClients(fetchParams);
  }, [fetchParams, fetchClients]);

  // Refresh clients list
  const refreshClients = useCallback(() => {
    fetchClients(fetchParams);
  }, [fetchParams, fetchClients]);

  // Validate form and return errors
  const validateForm = useCallback(() => {
    setFormErrors({});
    const errors = validateSupplierForm(formData, clientType, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }
    return true;
  }, [formData, clientType, t]);

  // Prepare client data for API
  const prepareClientData = useCallback(() => ({
    ...formData,
    birthDate: formData.birthDate || null,
  }), [formData]);

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData(createEmptyClientFormData());
    setClientType('person');
    setFormErrors({});
  }, []);

  // Validate and create supplier
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createClient(prepareClientData());
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
  }, [validateForm, createClient, prepareClientData, resetForm, refreshClients, success, showError, t]);

  // Validate and update supplier
  const handleUpdate = useCallback(async () => {
    if (!selectedClient || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await updateClient(selectedClient.id, prepareClientData());
      if (result) {
        setShowEditModal(false);
        setSelectedClient(null);
        setFormErrors({});
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
  }, [selectedClient, validateForm, updateClient, prepareClientData, refreshClients, success, showError, t]);

  // Delete supplier
  const handleDelete = useCallback(async (id: string) => {
    try {
      const result = await deleteClient(id);
      if (result) {
        setDeleteConfirm(null);
        refreshClients();
        success(t('supplierDeleted') || 'Supplier deleted successfully');
      } else {
        showError(t('errorDeletingSupplier') || 'Failed to delete supplier');
      }
    } catch (err) {
      showError(t('errorDeletingSupplier') || 'Failed to delete supplier');
    }
  }, [deleteClient, success, showError, t, refreshClients]);

  // Open edit modal with client data
  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setFormData(clientToFormData(client));
    setClientType(getClientType(client));
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  // Handle field changes
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

  // Clear form error for a field
  const handleClearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Filter handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Close add modal and reset form
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedClient(null);
    setFormErrors({});
  }, []);

  // Cancel edit modal
  const handleCancelEdit = useCallback(() => {
    setSelectedClient(null);
    setFormErrors({});
  }, []);

  // Table columns configuration
  const columns = useMemo(() => getSuppliersTableColumns({
    t,
    onEdit: handleEdit,
    onDelete: (id: string) => setDeleteConfirm(id),
  }), [t, handleEdit]);

  return (
    <PageContainer>
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
        onSearchChange={handleSearchChange}
        onClear={handleClearFilters}
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
        onClose={handleCloseAddModal}
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
        onClose={handleCloseEditModal}
        onCancel={handleCancelEdit}
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
    </PageContainer>
  );
}
