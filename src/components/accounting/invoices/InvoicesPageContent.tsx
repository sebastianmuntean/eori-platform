'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { InvoiceSummaryCards } from '@/components/accounting/invoices/InvoiceSummaryCards';
import { InvoiceFilters } from '@/components/accounting/invoices/InvoiceFilters';
import { InvoiceFormModal } from '@/components/accounting/invoices/InvoiceFormModal';
import { AddProductModal } from '@/components/accounting/invoices/AddProductModal';
import { ViewInvoiceModal } from '@/components/accounting/invoices/ViewInvoiceModal';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import { useInvoiceProductSelection } from '@/hooks/useInvoiceProductSelection';
import { useInvoiceTableColumns } from '@/components/accounting/invoices/InvoiceTableColumns';
import { prepareInvoiceData, validateInvoiceForm } from '@/lib/utils/invoiceHelpers';

const PAGE_SIZE = 10;
const PRODUCTS_PAGE_SIZE = 1000;

interface InvoicesPageContentProps {
  locale: string;
}

/**
 * Invoices page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function InvoicesPageContent({ locale }: InvoicesPageContentProps) {
  const t = useTranslations('common');

  const {
    invoices,
    loading,
    error,
    pagination,
    summary,
    fetchInvoices,
    fetchSummary,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
  } = useInvoices();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { products, fetchProducts, loading: productsLoading, createProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formData,
    newProductInput,
    setNewProductInput,
    resetForm,
    updateFormData,
    addLineItem,
    addProductItem,
    removeLineItem,
    updateLineItem,
  } = useInvoiceForm();

  const {
    productFormData,
    setProductFormData,
    getProductLabel,
    getProductOptions,
    handleProductSearch,
    handleCreateProduct,
    resetProductForm,
  } = useInvoiceProductSelection({
    products,
    fetchProducts,
    createProduct,
    formData,
    addProductItem,
    setNewProductInput,
    t,
  });

  // Fetch initial data
  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  // Fetch products when invoice type is 'received'
  useEffect(() => {
    if (formData.type === 'received') {
      fetchProducts({ isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
    }
  }, [formData.type, fetchProducts]);

  // Fetch warehouses when parish is selected
  useEffect(() => {
    if (formData.parishId) {
      fetchWarehouses({ parishId: formData.parishId, pageSize: PRODUCTS_PAGE_SIZE });
    }
  }, [formData.parishId, fetchWarehouses]);

  // Fetch invoices and summary when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: typeFilter ? (typeFilter as 'issued' | 'received') : undefined,
      status: statusFilter ? (statusFilter as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') : undefined,
      clientId: clientFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    };
    fetchInvoices(params);
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, clientFilter, dateFrom, dateTo, fetchInvoices, fetchSummary]);

  const handleCreate = useCallback(async () => {
    const validationError = validateInvoiceForm(formData, false);
    if (validationError) {
      alert(t(validationError) || t('fillRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceData = prepareInvoiceData(formData);
      const result = await createInvoice(invoiceData);

      if (result) {
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(t('errorCreatingInvoice') || 'Error creating invoice');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createInvoice, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedInvoice) return;

    const validationError = validateInvoiceForm(formData, true);
    if (validationError) {
      alert(t(validationError) || t('fillRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceData = prepareInvoiceData(formData);
      const result = await updateInvoice(selectedInvoice.id, invoiceData);

      if (result) {
        setShowEditModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert(t('errorUpdatingInvoice') || 'Error updating invoice');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedInvoice, formData, updateInvoice, t]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteInvoice(id);
      if (result) {
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert(t('errorDeletingInvoice') || 'Error deleting invoice');
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteInvoice, t]);

  const handleMarkAsPaid = useCallback(async (id: string) => {
    await markAsPaid(id);
  }, [markAsPaid]);

  const handleEdit = useCallback(async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    updateFormData({
      parishId: invoice.parishId,
      warehouseId: invoice.warehouseId || '',
      series: invoice.series || 'INV',
      number: invoice.number ? Number(invoice.number) : undefined,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      date: invoice.date,
      dueDate: invoice.dueDate,
      clientId: invoice.clientId,
      currency: invoice.currency || 'RON',
      description: invoice.description || '',
      status: invoice.status,
      items: invoice.items || [],
    });
    if (invoice.type === 'received') {
      await fetchProducts({ isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
    }
    setShowEditModal(true);
  }, [updateFormData, fetchProducts]);

  const handleView = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  }, []);

  const handleTypeChange = useCallback(async (type: 'issued' | 'received') => {
    if (type === 'received') {
      await fetchProducts({ isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
    }
  }, [fetchProducts]);

  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return clientId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  }, [clients]);

  const columns = useInvoiceTableColumns({
    getClientName,
    handleView,
    handleEdit,
    handleMarkAsPaid,
    setDeleteConfirm,
    t,
  });

  const handleFilterChange = useCallback((filterName: string, value: string) => {
    switch (filterName) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'parish':
        setParishFilter(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'client':
        setClientFilter(value);
        break;
      case 'dateFrom':
        setDateFrom(value);
        break;
      case 'dateTo':
        setDateTo(value);
        break;
    }
    setCurrentPage(1);
  }, []);

  const handleFilterClear = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  const handleCreateProductAndClose = useCallback(async () => {
    try {
      const success = await handleCreateProduct();
      if (success) {
        setShowAddProductModal(false);
        resetProductForm();
      }
    } catch (error) {
      // Error is already handled in handleCreateProduct
    }
  }, [handleCreateProduct, resetProductForm]);

  const handleCloseAddProductModal = useCallback(() => {
    setShowAddProductModal(false);
    resetProductForm();
  }, [resetProductForm]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('invoices') },
        ]}
        title={t('invoices')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('invoice')}</Button>}
      />

      <InvoiceSummaryCards summary={summary} t={t} />

      <Card>
        <CardHeader>
          <InvoiceFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => handleFilterChange('search', value)}
            parishFilter={parishFilter}
            onParishFilterChange={(value) => handleFilterChange('parish', value)}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => handleFilterChange('type', value)}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => handleFilterChange('status', value)}
            clientFilter={clientFilter}
            onClientFilterChange={(value) => handleFilterChange('client', value)}
            dateFrom={dateFrom}
            onDateFromChange={(value) => handleFilterChange('dateFrom', value)}
            dateTo={dateTo}
            onDateToChange={(value) => handleFilterChange('dateTo', value)}
            onClear={handleFilterClear}
            parishes={parishes}
            clients={clients}
            t={t}
          />
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading')}</div>
          ) : (
            <>
              <Table data={invoices} columns={columns} />
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
                      disabled={currentPage >= pagination.totalPages}
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

      <InvoiceFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onSubmit={handleCreate}
        title={`${t('add')} ${t('invoice')}`}
        isSubmitting={isSubmitting}
        formData={formData}
        onFormDataChange={updateFormData}
        onAddLineItem={addLineItem}
        onAddProduct={(product) => addProductItem(product, formData.warehouseId || null)}
        onUpdateItem={(index, field, value) => updateLineItem(index, field, value, products)}
        onRemoveItem={removeLineItem}
        newProductInput={newProductInput}
        onNewProductInputChange={setNewProductInput}
        onOpenAddProductModal={() => {
          setShowAddProductModal(true);
        }}
        parishes={parishes}
        warehouses={warehouses}
        clients={clients}
        products={products}
        productsLoading={productsLoading}
        onProductSearch={handleProductSearch}
        getProductLabel={getProductLabel}
        getProductOptions={getProductOptions}
        onTypeChange={handleTypeChange}
        t={t}
      />

      <InvoiceFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedInvoice(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedInvoice(null);
        }}
        onSubmit={handleUpdate}
        title={`${t('edit')} ${t('invoice')}`}
        isSubmitting={isSubmitting}
        formData={formData}
        onFormDataChange={updateFormData}
        onAddLineItem={addLineItem}
        onAddProduct={(product) => addProductItem(product, formData.warehouseId || null)}
        onUpdateItem={(index, field, value) => updateLineItem(index, field, value, products)}
        onRemoveItem={removeLineItem}
        newProductInput={newProductInput}
        onNewProductInputChange={setNewProductInput}
        onOpenAddProductModal={() => {
          setShowAddProductModal(true);
        }}
        parishes={parishes}
        warehouses={warehouses}
        clients={clients}
        products={products}
        productsLoading={productsLoading}
        onProductSearch={handleProductSearch}
        getProductLabel={getProductLabel}
        getProductOptions={getProductOptions}
        onTypeChange={handleTypeChange}
        t={t}
      />

      <ViewInvoiceModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        invoice={selectedInvoice}
        t={t}
      />

      <AddProductModal
        isOpen={showAddProductModal}
        onClose={handleCloseAddProductModal}
        onCancel={handleCloseAddProductModal}
        onSubmit={handleCreateProductAndClose}
        formData={productFormData}
        onFormDataChange={(data) => setProductFormData((prev) => ({ ...prev, ...data }))}
        t={t}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDelete')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
      />
    </PageContainer>
  );
}

