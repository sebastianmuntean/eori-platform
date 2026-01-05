'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCrudPage } from '@/hooks/useCrudPage';
import { TablePageLayout } from '@/components/accounting/TablePageLayout';
import { FormModal } from '@/components/accounting/FormModal';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useClients, Client } from '@/hooks/useClients';
import { FilterGrid, FilterClear, TypeFilter } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';
import { ClientForm, ClientFormData } from '@/components/accounting/ClientForm';
import {
  getClientDisplayName,
  getClientType,
  createEmptyClientFormData,
  clientToFormData,
} from '@/lib/utils/clients';
import { validateClientForm } from '@/lib/validations/clients';

const PAGE_SIZE = 10;

export default function ClientsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
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

  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState<ClientFormData>(createEmptyClientFormData());
  const [clientType, setClientType] = useState<'person' | 'company' | 'organization'>('person');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the reusable CRUD page hook
  const [crudState, crudActions] = useCrudPage<Client>({
    onEdit: (client) => {
      setFormData(clientToFormData(client));
      setClientType(getClientType(client));
      setFormErrors({});
    },
    onAdd: () => {
      resetForm();
    },
    resetFiltersCallback: () => {
      setTypeFilter('');
    },
  });

  // Fetch clients when filters or page changes
  useEffect(() => {
    fetchClients({
      page: crudState.currentPage,
      pageSize: PAGE_SIZE,
      search: crudState.searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [crudState.currentPage, crudState.searchTerm, fetchClients]);

  // Filter clients by type on client-side
  const filteredClients = useMemo(
    () => (typeFilter ? clients.filter((client) => getClientType(client) === typeFilter) : clients),
    [clients, typeFilter]
  );

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData(createEmptyClientFormData());
    setClientType('person');
    setFormErrors({});
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

  // Refresh clients list
  const refreshClients = useCallback(() => {
    fetchClients({
      page: crudState.currentPage,
      pageSize: PAGE_SIZE,
      search: crudState.searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [crudState.currentPage, crudState.searchTerm, fetchClients]);

  // Validate and create client
  const handleCreate = useCallback(async () => {
    setFormErrors({});
    const errors = validateClientForm(formData, clientType, t);
    
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
        crudActions.closeAddModal();
        resetForm();
        refreshClients();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, clientType, t, createClient, resetForm, refreshClients, crudActions]);

  // Validate and update client
  const handleUpdate = useCallback(async () => {
    if (!crudState.selectedItem) return;

    setFormErrors({});
    const errors = validateClientForm(formData, clientType, t);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateClient(crudState.selectedItem.id, {
        ...formData,
        birthDate: formData.birthDate || null,
      });
      if (result) {
        crudActions.closeEditModal();
        setFormErrors({});
        refreshClients();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [crudState.selectedItem, formData, clientType, t, updateClient, refreshClients, crudActions]);

  // Delete client
  const handleDeleteConfirm = useCallback(async () => {
    if (!crudState.deleteConfirm) return;
    const success = await deleteClient(crudState.deleteConfirm);
    if (success) {
      crudActions.closeDeleteConfirm();
      refreshClients();
    }
  }, [crudState.deleteConfirm, deleteClient, refreshClients, crudActions]);

  // Navigate to client statement
  const handleViewStatement = useCallback(
    (clientId: string) => {
      router.push(`/${locale}/dashboard/accounting/clients/${clientId}/statement`);
    },
    [router, locale]
  );

  // Table columns configuration
  const columns = useMemo(
    () => [
      { key: 'code' as keyof Client, label: t('code'), sortable: true },
      {
        key: 'code' as keyof Client,
        label: t('name'),
        sortable: true,
        render: (_: any, row: Client) => getClientDisplayName(row),
      },
      {
        key: 'code' as keyof Client,
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
        key: 'code' as keyof Client,
        label: t('actions'),
        sortable: false,
        render: (_: any, row: Client) => (
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
              {
                label: t('viewStatement') || 'View Statement',
                onClick: () => handleViewStatement(row.id),
              },
              { label: t('edit'), onClick: () => crudActions.handleEdit(row) },
              { label: t('delete'), onClick: () => crudActions.handleDelete(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, handleViewStatement, crudActions]
  );

  // Breadcrumbs configuration
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
      { label: t('clients') },
    ],
    [t, locale]
  );

  // Pagination handlers
  const handlePreviousPage = useCallback(() => {
    crudActions.setCurrentPage(Math.max(1, crudState.currentPage - 1));
  }, [crudState.currentPage, crudActions]);

  const handleNextPage = useCallback(() => {
    if (pagination) {
      crudActions.setCurrentPage(Math.min(pagination.totalPages, crudState.currentPage + 1));
    }
  }, [crudState.currentPage, pagination, crudActions]);

  return (
    <>
      <TablePageLayout
        title={t('clients')}
        breadcrumbs={breadcrumbs}
        addButtonLabel={`${t('add')} ${t('clients')}`}
        onAdd={crudActions.handleAdd}
        searchPlaceholder={`${t('search')} ${t('clients')}...`}
        searchValue={crudState.searchTerm}
        onSearchChange={crudActions.setSearchTerm}
        filters={
          <>
            <TypeFilter
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                crudActions.setCurrentPage(1);
              }}
              types={[
                { value: 'person', label: t('person') || 'Person' },
                { value: 'company', label: t('company') || 'Company' },
                { value: 'organization', label: t('organization') || 'Organization' },
              ]}
            />
            <FilterClear
              onClear={() => {
                crudActions.resetFilters();
              }}
            />
          </>
        }
        tableData={filteredClients}
        tableColumns={columns}
        loading={loading}
        error={error}
        pagination={pagination || null}
        currentPage={crudState.currentPage}
        onPageChange={crudActions.setCurrentPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        emptyMessage={t('noClients') || 'No clients found'}
      />

      {/* Add Client Modal */}
      <FormModal
        isOpen={crudState.showAddModal}
        onClose={crudActions.closeAddModal}
        title={`${t('add')} ${t('clients')}`}
        onSubmit={handleCreate}
        onCancel={resetForm}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('creating') || 'Creating...' : t('create') || 'Create'}
        error={error}
      >
        <ClientForm
          formData={formData}
          clientType={clientType}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onTypeChange={setClientType}
          onFieldChange={handleFieldChange}
          onClearError={handleClearError}
        />
      </FormModal>

      {/* Edit Client Modal */}
      <FormModal
        isOpen={crudState.showEditModal}
        onClose={crudActions.closeEditModal}
        title={`${t('edit')} ${t('clients')}`}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('updating') || 'Updating...' : t('update') || 'Update'}
        error={error}
      >
        <ClientForm
          formData={formData}
          clientType={clientType}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onTypeChange={setClientType}
          onFieldChange={handleFieldChange}
          onClearError={handleClearError}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!crudState.deleteConfirm}
        onClose={crudActions.closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title={t('confirmDelete')}
        message={t('confirmDeleteClient') || 'Are you sure you want to delete this client?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
      />
    </>
  );
}
