'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useClients, Client } from '@/hooks/useClients';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, getClientDisplayName } from '@/lib/utils/accounting';
import { validateSupplierForm, SupplierFormData } from '@/lib/validations/suppliers';
import { ClientForm, ClientFormData, createEmptyClientFormData, clientToFormData } from '@/components/accounting/ClientForm';
import { getClientType } from '@/lib/utils/clients';

export default function SuppliersPage() {
  const params = useParams();
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


  useEffect(() => {
    fetchClients({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchClients]);

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
  }, [formData, clientType, t, createClient, success, showError]);

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
  }, [selectedClient, formData, clientType, t, updateClient, success, showError]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteClient(id);
    if (result) {
      setDeleteConfirm(null);
      refreshClients();
      success(t('supplierDeleted') || 'Supplier deleted successfully');
    } else {
      showError(t('errorDeletingSupplier') || 'Failed to delete supplier');
    }
  }, [deleteClient, success, showError, t]);

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

  const refreshClients = useCallback(() => {
    fetchClients({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchClients]);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => handleEdit(row) },
            { label: t('delete'), onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ], [t, handleEdit, handleDelete]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('suppliers') },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('suppliers')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('suppliers')}</Button>
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
              placeholder={`${t('search')} ${t('suppliers')}...`}
            />
          </div>
          <FilterGrid>
            <FilterClear
              onClear={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            />
          </FilterGrid>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table
                data={clients}
                columns={columns}
              />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add')} ${t('suppliers')}`}
      >
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
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              resetForm();
            }} disabled={isSubmitting}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? t('creating') || 'Creating...' : t('create') || 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
          setFormErrors({});
        }}
        title={`${t('edit')} ${t('suppliers')}`}
      >
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
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setSelectedClient(null);
              setFormErrors({});
            }} disabled={isSubmitting}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? t('updating') || 'Updating...' : t('update') || 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDeleteSupplier') || 'Are you sure you want to delete this supplier?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}

