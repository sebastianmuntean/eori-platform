'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts, Product } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { InvoiceSummaryCards } from '@/components/accounting/invoices/InvoiceSummaryCards';
import { InvoiceFilters } from '@/components/accounting/invoices/InvoiceFilters';
import { InvoiceFormModal } from '@/components/accounting/invoices/InvoiceFormModal';
import { AddProductModal } from '@/components/accounting/invoices/AddProductModal';
import { ViewInvoiceModal } from '@/components/accounting/invoices/ViewInvoiceModal';
import { useInvoiceForm, InvoiceFormState } from '@/hooks/useInvoiceForm';
import { ExtendedInvoiceItem, calculateItemTotal, calculateTotals, formatCurrency } from '@/lib/utils/invoiceUtils';
import { AutocompleteOption } from '@/components/ui/Autocomplete';

export default function InvoicesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('invoices'));

  // Check permission to access invoices
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.INVOICES_VIEW);

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
  const [productFormData, setProductFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'buc',
    purchasePrice: '',
    salePrice: '',
    vatRate: '19',
    barcode: '',
    trackStock: true,
    minStock: '',
    isActive: true,
  });

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

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [permissionLoading, fetchParishes, fetchClients]);

  useEffect(() => {
    if (formData.type === 'received') {
      fetchProducts({ isActive: true, pageSize: 1000 });
    }
  }, [formData.type, fetchProducts]);

  useEffect(() => {
    if (formData.parishId) {
      fetchWarehouses({ parishId: formData.parishId, pageSize: 1000 });
    }
  }, [formData.parishId, fetchWarehouses]);

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      clientId: clientFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    fetchInvoices(params);
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [permissionLoading, currentPage, searchTerm, parishFilter, typeFilter, statusFilter, clientFilter, dateFrom, dateTo, fetchInvoices, fetchSummary]);

  const handleCreate = useCallback(async () => {
    if (!formData.parishId || !formData.series || !formData.date || !formData.dueDate || !formData.clientId || formData.items.length === 0) {
      alert(t('fillRequiredFields'));
      return;
    }

    const { total, vat } = calculateTotals(formData.items);
    const result = await createInvoice({
      ...formData,
      series: formData.series,
      number: formData.number as any,
      warehouseId: formData.warehouseId || null,
      amount: calculateTotals(formData.items).subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map((item) => {
        const extendedItem = item as ExtendedInvoiceItem;
        return {
          ...item,
          total: calculateItemTotal(item),
          productId: extendedItem.productId || null,
          warehouseId: extendedItem.warehouseId || (formData.warehouseId || null),
          unitCost: extendedItem.unitCost || null,
        };
      }),
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  }, [formData, createInvoice, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedInvoice) return;

    if (!formData.parishId || !formData.series || !formData.number || !formData.date || !formData.dueDate || !formData.clientId || formData.items.length === 0) {
      alert(t('fillRequiredFields'));
      return;
    }

    const { total, vat } = calculateTotals(formData.items);
    const result = await updateInvoice(selectedInvoice.id, {
      ...formData,
      series: formData.series,
      number: formData.number as any,
      warehouseId: formData.warehouseId || null,
      amount: calculateTotals(formData.items).subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map((item) => {
        const extendedItem = item as ExtendedInvoiceItem;
        return {
          ...item,
          total: calculateItemTotal(item),
          productId: extendedItem.productId || null,
          warehouseId: extendedItem.warehouseId || (formData.warehouseId || null),
          unitCost: extendedItem.unitCost || null,
        };
      }),
    });

    if (result) {
      setShowEditModal(false);
      setSelectedInvoice(null);
    }
  }, [selectedInvoice, formData, updateInvoice, t]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteInvoice(id);
    if (result) {
      setDeleteConfirm(null);
    }
  }, [deleteInvoice]);

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
      await fetchProducts({ isActive: true, pageSize: 1000 });
    }
    setShowEditModal(true);
  }, [updateFormData, fetchProducts]);

  const handleView = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  }, []);

  const handleTypeChange = useCallback(async (type: 'issued' | 'received') => {
    if (type === 'received') {
      await fetchProducts({ isActive: true, pageSize: 1000 });
    }
  }, [fetchProducts]);

  const getProductLabel = useCallback((product: Product) => `${product.code} - ${product.name}`, []);

  const getProductOptions = useCallback((excludeProductIds: string[] = []): AutocompleteOption[] => {
    return products
      .filter((p) => !excludeProductIds.includes(p.id))
      .map((p) => ({
        value: p.id,
        label: getProductLabel(p),
        product: p,
      }));
  }, [products, getProductLabel]);

  const handleProductSearch = useCallback((searchTerm: string) => {
    if (searchTerm.trim().length >= 2) {
      fetchProducts({ search: searchTerm.trim(), isActive: true, pageSize: 1000 });
    }
  }, [fetchProducts]);

  const handleCreateProduct = useCallback(async () => {
    try {
      if (!productFormData.code || !productFormData.name) {
        alert(t('fillRequiredFields') || 'Te rugăm să completezi toate câmpurile obligatorii');
        return;
      }

      if (!formData.parishId) {
        alert(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie pentru factură înainte de a adăuga produse');
        return;
      }

      const newProduct = await createProduct({
        ...productFormData,
        parishId: formData.parishId,
        purchasePrice: productFormData.purchasePrice || null,
        salePrice: productFormData.salePrice || null,
        minStock: productFormData.minStock || null,
      });

      if (newProduct) {
        await fetchProducts({ isActive: true, pageSize: 1000 });
        addProductItem(newProduct, formData.warehouseId || null);
        setShowAddProductModal(false);
        setNewProductInput('');
        setProductFormData({
          code: '',
          name: '',
          description: '',
          category: '',
          unit: 'buc',
          purchasePrice: '',
          salePrice: '',
          vatRate: '19',
          barcode: '',
          trackStock: true,
          minStock: '',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Eroare la crearea produsului';
      alert(errorMessage);
    }
  }, [productFormData, formData, createProduct, fetchProducts, addProductItem, setNewProductInput, t]);

  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return clientId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  }, [clients]);

  const columns: any[] = [
    { key: 'invoiceNumber' as keyof Invoice, label: t('invoiceNumber'), sortable: true },
    { key: 'date' as keyof Invoice, label: t('date'), sortable: true },
    { key: 'dueDate' as keyof Invoice, label: t('dueDate'), sortable: false },
    {
      key: 'type' as keyof Invoice,
      label: t('invoiceType'),
      sortable: false,
      render: (value: 'issued' | 'received') => (
        <Badge variant={value === 'issued' ? 'primary' : 'info'} size="sm">
          {value === 'issued' ? t('issued') : t('received')}
        </Badge>
      ),
    },
    {
      key: 'clientId' as keyof Invoice,
      label: t('clients'),
      sortable: false,
      render: (value: string) => getClientName(value),
    },
    {
      key: 'total' as keyof Invoice,
      label: t('total'),
      sortable: true,
      render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
    },
    {
      key: 'status' as keyof Invoice,
      label: t('status'),
      sortable: false,
      render: (value: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
        const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
          draft: 'secondary',
          sent: 'info',
          paid: 'success',
          overdue: 'danger',
          cancelled: 'secondary',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'id' as keyof Invoice,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Invoice) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('view'), onClick: () => handleView(row) },
            { label: t('edit'), onClick: () => handleEdit(row) },
            ...(row.status !== 'paid' ? [{ label: t('markAsPaid'), onClick: () => handleMarkAsPaid(row.id) }] : []),
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];

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

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

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
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            parishFilter={parishFilter}
            onParishFilterChange={(value) => {
              setParishFilter(value);
              setCurrentPage(1);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            clientFilter={clientFilter}
            onClientFilterChange={(value) => {
              setClientFilter(value);
              setCurrentPage(1);
            }}
            dateFrom={dateFrom}
            onDateFromChange={(value) => {
              setDateFrom(value);
              setCurrentPage(1);
            }}
            dateTo={dateTo}
            onDateToChange={(value) => {
              setDateTo(value);
              setCurrentPage(1);
            }}
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
        onClose={() => {
          setShowAddProductModal(false);
          setProductFormData({
            code: '',
            name: '',
            description: '',
            category: '',
            unit: 'buc',
            purchasePrice: '',
            salePrice: '',
            vatRate: '19',
            barcode: '',
            trackStock: true,
            minStock: '',
            isActive: true,
          });
        }}
        onCancel={() => {
          setShowAddProductModal(false);
          setProductFormData({
            code: '',
            name: '',
            description: '',
            category: '',
            unit: 'buc',
            purchasePrice: '',
            salePrice: '',
            vatRate: '19',
            barcode: '',
            trackStock: true,
            minStock: '',
            isActive: true,
          });
        }}
        onSubmit={handleCreateProduct}
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
