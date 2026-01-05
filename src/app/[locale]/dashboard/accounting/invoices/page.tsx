'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useInvoices, Invoice, InvoiceItem } from '@/hooks/useInvoices';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts, Product } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter, ClientFilter } from '@/components/ui/FilterGrid';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Select } from '@/components/ui/Select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/Autocomplete';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function InvoicesPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.INVOICES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('invoices'));

  // All hooks must be called before any conditional returns
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
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [newProductInput, setNewProductInput] = useState('');
  const previousItemsCountRef = useRef(0);
  const [parishFilter, setParishFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parishId: '',
    warehouseId: '',
    series: 'INV',
    number: undefined as number | undefined,
    invoiceNumber: '',
    type: 'issued' as 'issued' | 'received',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    clientId: '',
    currency: 'RON',
    description: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    items: [] as InvoiceItem[],
  });

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

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [permissionLoading, fetchParishes, fetchClients]);

  // Fetch products when invoice type is 'received' (products are system-wide, not filtered by parish)
  useEffect(() => {
    if (formData.type === 'received') {
      fetchProducts({ isActive: true, pageSize: 1000 });
    }
  }, [formData.type, fetchProducts]);

  // Reset product input when a new product is added
  useEffect(() => {
    if (formData.type === 'received' && formData.items.length > previousItemsCountRef.current) {
      // A new product was added, reset the input after a short delay
      setTimeout(() => {
        setNewProductInput('');
      }, 100);
    }
    previousItemsCountRef.current = formData.items.length;
  }, [formData.items.length, formData.type]);

  // Fetch warehouses when parish is selected
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
      clientId: partnerFilter || undefined,
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
  }, [permissionLoading, currentPage, searchTerm, parishFilter, typeFilter, statusFilter, partnerFilter, dateFrom, dateTo, fetchInvoices, fetchSummary]);

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = item.vat || 0;
    return subtotal + vatAmount;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vat = formData.items.reduce((sum, item) => sum + (item.vat || 0), 0);
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const handleCreate = async () => {
    if (!formData.parishId || !formData.series || !formData.date || !formData.dueDate || !formData.clientId || formData.items.length === 0) {
      alert(t('fillRequiredFields'));
      return;
    }

    const { total, vat } = calculateTotals();
    const result = await createInvoice({
      ...formData,
      series: formData.series,
      number: formData.number, // Optional - API will auto-generate if not provided
      warehouseId: formData.warehouseId || null, // Convert empty string to null
      amount: calculateTotals().subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map(item => {
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
  };

  const handleUpdate = async () => {
    if (!selectedInvoice) return;

    if (!formData.parishId || !formData.series || !formData.number || !formData.date || !formData.dueDate || !formData.clientId || formData.items.length === 0) {
      alert(t('fillRequiredFields'));
      return;
    }

    const { total, vat } = calculateTotals();
    const result = await updateInvoice(selectedInvoice.id, {
      ...formData,
      series: formData.series,
      number: formData.number,
      warehouseId: formData.warehouseId || null, // Convert empty string to null
      amount: calculateTotals().subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map(item => {
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
  };

  const handleDelete = async (id: string) => {
    const result = await deleteInvoice(id);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid(id);
  };

  const handleEdit = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
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
    // Fetch products if it's a received invoice (products are system-wide, not filtered by parish)
    if (invoice.type === 'received') {
      await fetchProducts({ isActive: true, pageSize: 1000 });
    }
    setShowEditModal(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      warehouseId: '',
      series: 'INV',
      number: undefined,
      invoiceNumber: '',
      type: 'issued',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      clientId: '',
      currency: 'RON',
      description: '',
      status: 'draft',
      items: [],
    });
    setNewProductInput('');
  };

  // Helper function to calculate next invoice number
  const calculateNextNumber = async (parishId: string, series: string, type: string, warehouseId?: string) => {
    if (!parishId || !series || !type) return null;

    try {
      const queryParams = new URLSearchParams({
        parishId,
        series,
        type,
      });
      if (warehouseId) {
        queryParams.append('warehouseId', warehouseId);
      }

      const response = await fetch(`/api/accounting/invoices/next-number?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        return result.data.nextNumber;
      }
    } catch (error) {
      console.error('Error fetching next invoice number:', error);
    }
    return null;
  };

  // Handle warehouse selection - auto-fill series and calculate next number
  const handleWarehouseChange = async (warehouseId: string) => {
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    const newSeries = selectedWarehouse?.invoiceSeries || formData.series || 'INV';
    
    // Calculate next number
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      newSeries,
      formData.type,
      warehouseId || undefined
    );

    setFormData({
      ...formData,
      warehouseId,
      series: newSeries,
      number: nextNumber || formData.number,
    });
  };

  // Extended InvoiceItem interface for local use
  interface ExtendedInvoiceItem extends InvoiceItem {
    productId?: string | null;
    warehouseId?: string | null;
    unitCost?: number | null;
  }

  const addLineItem = () => {
    if (formData.type === 'received') {
      // For received invoices, add empty product item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          { description: '', quantity: 1, unitPrice: 0, unitCost: 0, vat: 0, total: 0, productId: null, warehouseId: formData.warehouseId || null },
        ] as ExtendedInvoiceItem[],
      });
    } else {
      // For issued invoices, add regular line item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          { description: '', quantity: 1, unitPrice: 0, vat: 0, total: 0 },
        ],
      });
    }
  };

  const addProductItem = (product: Product) => {
    const purchasePrice = parseFloat(product.purchasePrice || '0');
    const salePrice = parseFloat(product.salePrice || '0');
    const vatRate = parseFloat(product.vatRate || '19');
    
    const newItem: ExtendedInvoiceItem = {
      description: product.name,
      quantity: 1,
      unitPrice: salePrice, // Preț de ieșire
      unitCost: purchasePrice, // Preț de intrare
      vat: (salePrice * vatRate) / 100,
      total: salePrice + (salePrice * vatRate) / 100,
      productId: product.id,
      warehouseId: formData.warehouseId || null,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem] as ExtendedInvoiceItem[],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: keyof ExtendedInvoiceItem, value: any) => {
    const newItems = [...formData.items] as ExtendedInvoiceItem[];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is selected, update description
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = parseFloat(product.salePrice || '0');
        newItems[index].unitCost = parseFloat(product.purchasePrice || '0');
        const vatRate = parseFloat(product.vatRate || '19');
        newItems[index].vat = (newItems[index].unitPrice * vatRate) / 100;
      }
    }
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'unitCost') {
      const subtotal = newItems[index].quantity * newItems[index].unitPrice;
      const vatAmount = newItems[index].vat || 0;
      newItems[index].total = subtotal + vatAmount;
    }
    
    setFormData({ ...formData, items: newItems as InvoiceItem[] });
  };

  const formatCurrency = (amount: string | number, currency: string = 'RON') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
  };

  // Helper functions for product Autocomplete
  const getProductLabel = (product: Product) => `${product.code} - ${product.name}`;
  
  const getProductIdFromLabel = (label: string): string | null => {
    const product = products.find(p => getProductLabel(p) === label);
    return product?.id || null;
  };

  const getProductOptions = (excludeProductIds: string[] = []): AutocompleteOption[] => {
    return products
      .filter(p => !excludeProductIds.includes(p.id))
      .map(p => ({
        value: p.id,
        label: getProductLabel(p),
        product: p,
      }));
  };

  const handleProductSearch = (searchTerm: string) => {
    setProductSearchTerm(searchTerm);
    if (searchTerm.trim().length >= 2) {
      fetchProducts({ search: searchTerm.trim(), isActive: true, pageSize: 1000 });
    }
  };

  const handleProductSelect = (label: string, excludeProductIds: string[] = []) => {
    const productId = getProductIdFromLabel(label);
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product && !excludeProductIds.includes(productId)) {
        addProductItem(product);
        // Input will be reset by useEffect when item is added
      }
    }
  };

  const handleCreateProduct = async () => {
    try {
      // Validate required fields
      if (!productFormData.code || !productFormData.name) {
        alert(t('fillRequiredFields') || 'Te rugăm să completezi toate câmpurile obligatorii');
        return;
      }

      // Check if parish is selected in invoice form
      if (!formData.parishId) {
        alert(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie pentru factură înainte de a adăuga produse');
        return;
      }

      // Use the invoice's parishId for the product (products are generic but need a parish association)
      const newProduct = await createProduct({
        ...productFormData,
        parishId: formData.parishId, // Use invoice's parish
        purchasePrice: productFormData.purchasePrice || null,
        salePrice: productFormData.salePrice || null,
        minStock: productFormData.minStock || null,
      });
      
      if (newProduct) {
        // Refresh products list
        await fetchProducts({ isActive: true, pageSize: 1000 });
        // Add the new product to the invoice
        addProductItem(newProduct);
        // Close modal and reset form
        setShowAddProductModal(false);
        setNewProductInput(''); // Reset autocomplete input
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
  };

  const handleProductChange = (index: number, label: string) => {
    const productId = getProductIdFromLabel(label);
    if (productId) {
      updateLineItem(index, 'productId', productId);
    } else {
      updateLineItem(index, 'productId', null);
    }
  };

  const getProductLabelForItem = (item: ExtendedInvoiceItem): string => {
    if (!item.productId) return '';
    const product = products.find(p => p.id === item.productId);
    return product ? getProductLabel(product) : '';
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return clientId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  };

  const { subtotal: summarySubtotal, vat: summaryVat, total: summaryTotal } = summary
    ? { subtotal: 0, vat: 0, total: 0 }
    : calculateTotals();

  const columns = [
    { key: 'invoiceNumber', label: t('invoiceNumber'), sortable: true },
    { key: 'date', label: t('date'), sortable: true },
    { key: 'dueDate', label: t('dueDate'), sortable: false },
    {
      key: 'type',
      label: t('invoiceType'),
      sortable: false,
      render: (value: 'issued' | 'received') => (
        <Badge variant={value === 'issued' ? 'primary' : 'info'} size="sm">
          {value === 'issued' ? t('issued') : t('received')}
        </Badge>
      ),
    },
    {
      key: 'clientId',
      label: t('clients'),
      sortable: false,
      render: (value: string) => getClientName(value),
    },
    {
      key: 'total',
      label: t('total'),
      sortable: true,
      render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
    },
    {
      key: 'status',
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
      key: 'actions',
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

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('invoices') },
  ];

  const { subtotal, vat, total } = calculateTotals();

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('invoices')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('invoice')}</Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('totalIssued')}</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalIssued)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('totalReceived')}</p>
                  <p className="text-2xl font-bold text-info">{formatCurrency(summary.totalReceived)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('unpaid')}</p>
                  <p className="text-2xl font-bold text-warning">{summary.unpaidCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('overdue')}</p>
                  <p className="text-2xl font-bold text-danger">{summary.overdueCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

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
            <TypeFilter
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              types={[
                { value: 'issued', label: t('issued') },
                { value: 'received', label: t('received') },
              ]}
            />
            <StatusFilter
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              statuses={[
                { value: 'draft', label: t('draft') },
                { value: 'sent', label: t('sent') },
                { value: 'paid', label: t('paid') },
                { value: 'overdue', label: t('overdue') },
                { value: 'cancelled', label: t('cancelled') },
              ]}
            />
            <ClientFilter
              value={partnerFilter}
              onChange={(value) => {
                setPartnerFilter(value);
                setCurrentPage(1);
              }}
              clients={clients}
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
                setTypeFilter('');
                setStatusFilter('');
                setPartnerFilter('');
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
              <Table data={invoices} columns={columns} loading={loading} />
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
        title={`${t('add')} ${t('invoice')}`}
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
                onChange={(e) => {
                  setFormData({ ...formData, parishId: e.target.value, warehouseId: '' });
                }}
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
            <div>
              <label className="block text-sm font-medium mb-1">{t('warehouse')}</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={!formData.parishId}
              >
                <option value="">{t('selectWarehouse') || 'Select Warehouse'}</option>
                {warehouses
                  .filter(w => w.parishId === formData.parishId)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </div>
            <Input
              label={`${t('series') || 'Serie'} *`}
              value={formData.series}
              onChange={async (e) => {
                const newSeries = e.target.value.toUpperCase();
                const nextNumber = await calculateNextNumber(
                  formData.parishId,
                  newSeries,
                  formData.type,
                  formData.warehouseId || undefined
                );
                setFormData({
                  ...formData,
                  series: newSeries,
                  number: nextNumber || formData.number,
                });
              }}
              required
              placeholder="INV"
            />
            <Input
              type="number"
              label={`${t('number') || 'Număr'} *`}
              value={formData.number || ''}
              onChange={(e) => setFormData({ ...formData, number: e.target.value ? parseInt(e.target.value) : undefined })}
              required
            />
            <Input
              label={t('invoiceNumber')}
              value={formData.series && formData.number ? `${formData.series}-${String(formData.number).padStart(6, '0')}` : ''}
              disabled
              className="bg-gray-100"
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoiceType')} *</label>
              <select
                value={formData.type}
                onChange={async (e) => {
                  const newType = e.target.value as 'issued' | 'received';
                  const nextNumber = await calculateNextNumber(
                    formData.parishId,
                    formData.series,
                    newType,
                    formData.warehouseId || undefined
                  );
                  // Fetch products if switching to received type (products are system-wide, not filtered by parish)
                  if (newType === 'received') {
                    await fetchProducts({ isActive: true, pageSize: 1000 });
                  }
                  setFormData({
                    ...formData,
                    type: newType,
                    number: nextNumber || formData.number,
                    items: [], // Reset items when changing type
                  });
                  setNewProductInput(''); // Reset product input when changing type
                }}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="issued">{t('issued')}</option>
                <option value="received">{t('received')}</option>
              </select>
            </div>
            <Input
              type="date"
              label={`${t('date')} *`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              type="date"
              label={`${t('dueDate')} *`}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
            <ClientSelect
              value={formData.clientId}
              onChange={(value) => setFormData({ ...formData, clientId: value })}
              clients={clients}
              onlyCompanies={true}
              required
              label={t('clients')}
            />
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          {/* Line Items - Different interface for received vs issued invoices */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold">
                {formData.type === 'received' ? (t('products') || 'Produse') : (t('lineItems') || 'Linii Factură')} *
              </label>
              {formData.type === 'received' ? (
                <div className="flex items-center gap-2">
                  <div className="w-64">
                    <Autocomplete
                      value={newProductInput}
                      onChange={(label) => {
                        setNewProductInput(label);
                        // Only add product when a valid option is selected (not during typing)
                        if (label && products.some(p => getProductLabel(p) === label)) {
                          const excludeIds = formData.items
                            .map((item: ExtendedInvoiceItem) => item.productId)
                            .filter((id): id is string => !!id);
                          handleProductSelect(label, excludeIds);
                        }
                      }}
                      options={getProductOptions(
                        formData.items
                          .map((item: ExtendedInvoiceItem) => item.productId)
                          .filter((id): id is string => !!id)
                      )}
                      placeholder={t('selectProduct') || 'Selectează Produs'}
                      loading={productsLoading}
                      onSearch={handleProductSearch}
                      getOptionLabel={(option) => option.label}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductFormData({
                        ...productFormData,
                        parishId: formData.parishId || '',
                      });
                      setShowAddProductModal(true);
                    }}
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  {t('add')} {t('lineItems')}
                </Button>
              )}
            </div>
            <div className="space-y-2 border rounded p-2">
              {formData.items.length === 0 ? (
                <p className="text-sm text-text-secondary">{t('noData')}</p>
              ) : (
                formData.items.map((item, index) => {
                  const extendedItem = item as ExtendedInvoiceItem;
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                      {formData.type === 'received' ? (
                        <>
                          <div className="col-span-3">
                            <Input
                              label={t('product') || 'Produs'}
                              value={extendedItem.description || ''}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder={t('productName') || 'Nume produs'}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.001"
                              label={t('quantity') || 'Cantitate'}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('purchasePrice') || 'Preț Intrare'}
                              value={extendedItem.unitCost || 0}
                              onChange={(e) => updateLineItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('salePrice') || 'Preț Ieșire'}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm font-medium pt-6">{formatCurrency(item.total, formData.currency)}</div>
                          </div>
                          <div className="col-span-1">
                            <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                              ×
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-4">
                            <Input
                              label={t('description')}
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              label={t('quantity')}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('unitPrice')}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('vat')}
                              value={item.vat || 0}
                              onChange={(e) => updateLineItem(index, 'vat', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-1">
                            <div className="text-sm font-medium pt-6">{formatCurrency(item.total, formData.currency)}</div>
                          </div>
                          <div className="col-span-1">
                            <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                              ×
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {formData.items.length > 0 && (
              <div className="mt-4 text-right space-y-1">
                <div className="text-sm">
                  {t('total')}: {formatCurrency(subtotal, formData.currency)}
                </div>
                <div className="text-sm">
                  {t('vat')}: {formatCurrency(vat, formData.currency)}
                </div>
                <div className="text-lg font-bold">
                  {t('total')}: {formatCurrency(total, formData.currency)}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="draft">{t('draft')}</option>
                <option value="sent">{t('sent')}</option>
                <option value="paid">{t('paid')}</option>
                <option value="overdue">{t('overdue')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCancel={() => setShowEditModal(false)}
        title={`${t('edit')} ${t('invoice')}`}
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
                onChange={(e) => {
                  setFormData({ ...formData, parishId: e.target.value, warehouseId: '' });
                }}
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
            <div>
              <label className="block text-sm font-medium mb-1">{t('warehouse')}</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={!formData.parishId}
              >
                <option value="">{t('selectWarehouse') || 'Select Warehouse'}</option>
                {warehouses
                  .filter(w => w.parishId === formData.parishId)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </div>
            <Input
              label={`${t('series') || 'Serie'} *`}
              value={formData.series}
              onChange={(e) => setFormData({ ...formData, series: e.target.value.toUpperCase() })}
              required
              placeholder="INV"
            />
            <Input
              type="number"
              label={`${t('number') || 'Număr'} *`}
              value={formData.number || ''}
              onChange={(e) => setFormData({ ...formData, number: e.target.value ? parseInt(e.target.value) : undefined })}
              required
            />
            <Input
              label={t('invoiceNumber')}
              value={formData.series && formData.number ? `${formData.series}-${String(formData.number).padStart(6, '0')}` : ''}
              disabled
              className="bg-gray-100"
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoiceType')} *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'issued' | 'received' })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="issued">{t('issued')}</option>
                <option value="received">{t('received')}</option>
              </select>
            </div>
            <Input
              type="date"
              label={`${t('date')} *`}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              type="date"
              label={`${t('dueDate')} *`}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
            <ClientSelect
              value={formData.clientId}
              onChange={(value) => setFormData({ ...formData, clientId: value })}
              clients={clients}
              onlyCompanies={true}
              required
              label={t('clients')}
            />
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          {/* Line Items - Different interface for received vs issued invoices */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold">
                {formData.type === 'received' ? (t('products') || 'Produse') : (t('lineItems') || 'Linii Factură')} *
              </label>
              {formData.type === 'received' ? (
                <div className="flex items-center gap-2">
                  <div className="w-64">
                    <Autocomplete
                      value={newProductInput}
                      onChange={(label) => {
                        setNewProductInput(label);
                        // Only add product when a valid option is selected (not during typing)
                        if (label && products.some(p => getProductLabel(p) === label)) {
                          const excludeIds = formData.items
                            .map((item: ExtendedInvoiceItem) => item.productId)
                            .filter((id): id is string => !!id);
                          handleProductSelect(label, excludeIds);
                        }
                      }}
                      options={getProductOptions(
                        formData.items
                          .map((item: ExtendedInvoiceItem) => item.productId)
                          .filter((id): id is string => !!id)
                      )}
                      placeholder={t('selectProduct') || 'Selectează Produs'}
                      loading={productsLoading}
                      onSearch={handleProductSearch}
                      getOptionLabel={(option) => option.label}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductFormData({
                        ...productFormData,
                        parishId: formData.parishId || '',
                      });
                      setShowAddProductModal(true);
                    }}
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  {t('add')} {t('lineItems')}
                </Button>
              )}
            </div>
            <div className="space-y-2 border rounded p-2">
              {formData.items.length === 0 ? (
                <p className="text-sm text-text-secondary">{t('noData')}</p>
              ) : (
                formData.items.map((item, index) => {
                  const extendedItem = item as ExtendedInvoiceItem;
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                      {formData.type === 'received' ? (
                        <>
                          <div className="col-span-3">
                            <Input
                              label={t('product') || 'Produs'}
                              value={extendedItem.description || ''}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder={t('productName') || 'Nume produs'}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.001"
                              label={t('quantity') || 'Cantitate'}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('purchasePrice') || 'Preț Intrare'}
                              value={extendedItem.unitCost || 0}
                              onChange={(e) => updateLineItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('salePrice') || 'Preț Ieșire'}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm font-medium pt-6">{formatCurrency(item.total, formData.currency)}</div>
                          </div>
                          <div className="col-span-1">
                            <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                              ×
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-4">
                            <Input
                              label={t('description')}
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              label={t('quantity')}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('unitPrice')}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              label={t('vat')}
                              value={item.vat || 0}
                              onChange={(e) => updateLineItem(index, 'vat', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-1">
                            <div className="text-sm font-medium pt-6">{formatCurrency(item.total, formData.currency)}</div>
                          </div>
                          <div className="col-span-1">
                            <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                              ×
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {formData.items.length > 0 && (
              <div className="mt-4 text-right space-y-1">
                <div className="text-sm">
                  {t('total')}: {formatCurrency(subtotal, formData.currency)}
                </div>
                <div className="text-sm">
                  {t('vat')}: {formatCurrency(vat, formData.currency)}
                </div>
                <div className="text-lg font-bold">
                  {t('total')}: {formatCurrency(total, formData.currency)}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="draft">{t('draft')}</option>
                <option value="sent">{t('sent')}</option>
                <option value="paid">{t('paid')}</option>
                <option value="overdue">{t('overdue')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
          </div>
        </div>
      </FormModal>

      {/* View Modal - Read-only */}
      {selectedInvoice && (
        <SimpleModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`${t('view')} ${t('invoice')}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">{t('invoiceNumber')}</p>
                <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('status')}</p>
                <Badge variant="success" size="sm">{t(selectedInvoice.status)}</Badge>
              </div>
            </div>
            {/* Add more read-only fields */}
          </div>
        </SimpleModal>
      )}

      {/* Add Product Modal */}
      <FormModal
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
        title={t('addProduct') || 'Adaugă Produs'}
        onSubmit={handleCreateProduct}
        isSubmitting={false}
        submitLabel={t('create')}
        cancelLabel={t('cancel')}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label={`${t('code')} *`}
            value={productFormData.code}
            onChange={(e) => setProductFormData({ ...productFormData, code: e.target.value })}
            required
          />
          <Input
            label={`${t('name')} *`}
            value={productFormData.name}
            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
            required
          />
          <Input
            label={t('description')}
            value={productFormData.description}
            onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
          />
          <Select
            label={t('category')}
            value={productFormData.category}
            onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
            options={[
              { value: '', label: t('select') || 'Selectează...' },
              { value: 'pangar', label: 'Pangar' },
              { value: 'material', label: 'Material' },
              { value: 'service', label: 'Serviciu' },
              { value: 'fixed', label: 'Mijloc Fix' },
              { value: 'other', label: 'Altele' },
            ]}
          />
          <Select
            label={`${t('unit')} *`}
            value={productFormData.unit}
            onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
            options={[
              { value: 'buc', label: 'Bucată (buc)' },
              { value: 'kg', label: 'Kilogram (kg)' },
              { value: 'g', label: 'Gram (g)' },
              { value: 'l', label: 'Litru (l)' },
              { value: 'ml', label: 'Mililitru (ml)' },
              { value: 'm', label: 'Metru (m)' },
              { value: 'cm', label: 'Centimetru (cm)' },
              { value: 'm2', label: 'Metru pătrat (m²)' },
              { value: 'm3', label: 'Metru cub (m³)' },
              { value: 'pachet', label: 'Pachet' },
              { value: 'cutie', label: 'Cutie' },
              { value: 'set', label: 'Set' },
              { value: 'pereche', label: 'Pereche' },
            ]}
            required
          />
          <Input
            type="number"
            step="0.01"
            label={t('purchasePrice')}
            value={productFormData.purchasePrice}
            onChange={(e) => setProductFormData({ ...productFormData, purchasePrice: e.target.value })}
          />
          <Input
            type="number"
            step="0.01"
            label={t('salePrice')}
            value={productFormData.salePrice}
            onChange={(e) => setProductFormData({ ...productFormData, salePrice: e.target.value })}
          />
          <Input
            type="number"
            step="0.01"
            label={t('vatRate')}
            value={productFormData.vatRate}
            onChange={(e) => setProductFormData({ ...productFormData, vatRate: e.target.value })}
          />
          <Input
            label={t('barcode')}
            value={productFormData.barcode}
            onChange={(e) => setProductFormData({ ...productFormData, barcode: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trackStock"
              checked={productFormData.trackStock}
              onChange={(e) => setProductFormData({ ...productFormData, trackStock: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="trackStock" className="text-sm font-medium">
              {t('trackStock') || 'Urmărește stoc'}
            </label>
          </div>
          {productFormData.trackStock && (
            <Input
              type="number"
              step="0.001"
              label={t('minStock')}
              value={productFormData.minStock}
              onChange={(e) => setProductFormData({ ...productFormData, minStock: e.target.value })}
            />
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}

