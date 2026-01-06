'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { useClients, Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { ClientForm, ClientFormData } from '@/components/accounting/ClientForm';
import { ClientsFiltersCard } from '@/components/accounting/ClientsFiltersCard';
import { ClientsTableCard } from '@/components/accounting/ClientsTableCard';
import { DeleteClientDialog } from '@/components/accounting/DeleteClientDialog';
import {
  getClientDisplayName,
  getClientType,
  createEmptyClientFormData,
  clientToFormData,
} from '@/lib/utils/clients';
import { validateClientForm } from '@/lib/validations/clients';
import { PageContainer } from '@/components/ui/PageContainer';

const PAGE_SIZE = 10;

interface ClientsPageContentProps {
  locale: string;
}

/**
 * Clients page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function ClientsPageContent({ locale }: ClientsPageContentProps) {
  const router = useRouter();
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

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(createEmptyClientFormData());
  const [clientType, setClientType] = useState<'person' | 'company' | 'organization'>('person');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  // Filter clients by type on client-side (API doesn't support it yet)
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
  }, []);

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
    fetchClients(fetchParams);
  }, [fetchParams, fetchClients]);

  // Validate form and return errors
  const validateForm = useCallback(() => {
    setFormErrors({});
    const errors = validateClientForm(formData, clientType, t);
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

  // Validate and create client
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createClient(prepareClientData());
      if (result) {
        setShowAddModal(false);
        resetForm();
        refreshClients();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, createClient, prepareClientData, resetForm, refreshClients]);

  // Validate and update client
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
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClient, validateForm, updateClient, prepareClientData, refreshClients]);

  // Delete client
  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteClient(id);
      if (success) {
        setDeleteConfirm(null);
        refreshClients();
      }
    },
    [deleteClient, refreshClients]
  );

  // Filter handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('');
    setCurrentPage(1);
  }, []);

  // Open edit modal with client data
  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setFormData(clientToFormData(client));
    setClientType(getClientType(client));
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  // Navigate to client statement
  const handleViewStatement = useCallback(
    (clientId: string) => {
      router.push(`/${locale}/dashboard/accounting/clients/${clientId}/statement`);
    },
    [router, locale]
  );

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
              { label: t('edit'), onClick: () => handleEdit(row) },
              { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, handleViewStatement, handleEdit]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('clients') },
        ]}
        title={t('clients')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('clients')}</Button>}
      />

      {/* Filters */}
      <ClientsFiltersCard
        searchTerm={searchTerm}
        typeFilter={typeFilter}
        onSearchChange={handleSearchChange}
        onTypeFilterChange={handleTypeFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Clients Table */}
      <ClientsTableCard
        data={filteredClients}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No clients available'}
      />

      {/* Add Client Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        title={`${t('add')} ${t('clients')}`}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('creating') || 'Creating...' : t('create') || 'Create'}
        cancelLabel={t('cancel') || 'Cancel'}
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
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        title={`${t('edit')} ${t('clients')}`}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('updating') || 'Updating...' : t('update') || 'Update'}
        cancelLabel={t('cancel') || 'Cancel'}
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
      <DeleteClientDialog
        isOpen={!!deleteConfirm}
        clientId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

