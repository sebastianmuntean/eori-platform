'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useClients, Client } from '@/hooks/useClients';
import { SearchInput } from '@/components/ui/SearchInput';
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

  // Fetch clients when filters or page changes
  useEffect(() => {
    fetchClients({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchClients]);

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
    fetchClients({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchClients]);

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
        setShowAddModal(false);
        resetForm();
        refreshClients();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, clientType, t, createClient, resetForm, refreshClients]);

  // Validate and update client
  const handleUpdate = useCallback(async () => {
    if (!selectedClient) return;

    setFormErrors({});
    const errors = validateClientForm(formData, clientType, t);
    
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
        setFormErrors({});
        refreshClients();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClient, formData, clientType, t, updateClient, refreshClients]);

  // Delete client
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm(t('confirmDeleteClient') || 'Are you sure you want to delete this client?')) {
        const success = await deleteClient(id);
        if (success) {
          refreshClients();
        }
      }
    },
    [t, deleteClient, refreshClients]
  );

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
              { label: t('delete'), onClick: () => handleDelete(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, handleViewStatement, handleEdit, handleDelete]
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('clients')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {t('add')} {t('clients')}
        </Button>
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
              placeholder={`${t('search')} ${t('clients')}...`}
            />
          </div>
          <FilterGrid>
            <TypeFilter
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              types={[
                { value: 'person', label: t('person') || 'Person' },
                { value: 'company', label: t('company') || 'Company' },
                { value: 'organization', label: t('organization') || 'Organization' },
              ]}
            />
            <FilterClear
              onClear={() => {
                setSearchTerm('');
                setTypeFilter('');
                setCurrentPage(1);
              }}
            />
          </FilterGrid>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table data={filteredClients} columns={columns} />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages} (
                    {pagination.total} {t('total') || 'total'})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous') || 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next') || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Client Modal */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal} title={`${t('add')} ${t('clients')}`}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}
          <ClientForm
            formData={formData}
            clientType={clientType}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            onTypeChange={setClientType}
            onFieldChange={handleFieldChange}
            onClearError={handleClearError}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isSubmitting}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? t('creating') || 'Creating...' : t('create') || 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title={`${t('edit')} ${t('clients')}`}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}
          <ClientForm
            formData={formData}
            clientType={clientType}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            onTypeChange={setClientType}
            onFieldChange={handleFieldChange}
            onClearError={handleClearError}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSubmitting}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? t('updating') || 'Updating...' : t('update') || 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
