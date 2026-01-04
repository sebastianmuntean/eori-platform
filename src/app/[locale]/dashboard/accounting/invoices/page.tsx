'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useInvoices, Invoice, InvoiceItem } from '@/hooks/useInvoices';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter, ClientFilter } from '@/components/ui/FilterGrid';

export default function InvoicesPage() {
  const params = useParams();
  const locale = params.locale as string;
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

  const [searchTerm, setSearchTerm] = useState('');
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
    dueDate: '',
    clientId: '',
    currency: 'RON',
    description: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    items: [] as InvoiceItem[],
  });

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  // Fetch warehouses when parish is selected
  useEffect(() => {
    if (formData.parishId) {
      fetchWarehouses({ parishId: formData.parishId, pageSize: 1000 });
    }
  }, [formData.parishId, fetchWarehouses]);

  useEffect(() => {
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
  }, [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, partnerFilter, dateFrom, dateTo, fetchInvoices, fetchSummary]);

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
      amount: calculateTotals().subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map(item => ({ ...item, total: calculateItemTotal(item) })),
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
      amount: calculateTotals().subtotal.toString(),
      vat: vat.toString(),
      total: total.toString(),
      items: formData.items.map(item => ({ ...item, total: calculateItemTotal(item) })),
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

  const handleEdit = (invoice: Invoice) => {
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
      dueDate: '',
      clientId: '',
      currency: 'RON',
      description: '',
      status: 'draft',
      items: [],
    });
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

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: '', quantity: 1, unitPrice: 0, vat: 0, total: 0 },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const subtotal = newItems[index].quantity * newItems[index].unitPrice;
      const vatAmount = newItems[index].vat || 0;
      newItems[index].total = subtotal + vatAmount;
    }
    setFormData({ ...formData, items: newItems });
  };

  const formatCurrency = (amount: string | number, currency: string = 'RON') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`${t('add')} ${t('invoice')}`} size="full">
        <div className="space-y-6 overflow-y-auto">
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
                  setFormData({
                    ...formData,
                    type: newType,
                    number: nextNumber || formData.number,
                  });
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
            <div>
              <label className="block text-sm font-medium mb-1">{t('clients')} *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">{t('selectClient') || 'Select Client'}</option>
                {clients
                  .filter((c) => c.parishId === formData.parishId)
                  .map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                    </option>
                  ))}
              </select>
            </div>
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          {/* Line Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold">{t('lineItems')} *</label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                {t('add')} {t('lineItems')}
              </Button>
            </div>
            <div className="space-y-2 border rounded p-2">
              {formData.items.length === 0 ? (
                <p className="text-sm text-text-secondary">{t('noData')}</p>
              ) : (
                formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
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
                      <div className="text-sm font-medium">{formatCurrency(item.total, formData.currency)}</div>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                        ×
                      </Button>
                    </div>
                  </div>
                ))
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
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`${t('edit')} ${t('invoice')}`} size="full">
        <div className="space-y-6 overflow-y-auto">
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
            <div>
              <label className="block text-sm font-medium mb-1">{t('clients')} *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">{t('selectClient') || 'Select Client'}</option>
                {clients
                  .filter((c) => c.parishId === formData.parishId)
                  .map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                    </option>
                  ))}
              </select>
            </div>
            <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          {/* Line Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold">{t('lineItems')} *</label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                {t('add')} {t('lineItems')}
              </Button>
            </div>
            <div className="space-y-2 border rounded p-2">
              {formData.items.length === 0 ? (
                <p className="text-sm text-text-secondary">{t('noData')}</p>
              ) : (
                formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
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
                      <div className="text-sm font-medium">{formatCurrency(item.total, formData.currency)}</div>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="danger" size="sm" onClick={() => removeLineItem(index)}>
                        ×
                      </Button>
                    </div>
                  </div>
                ))
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
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('update')}</Button>
          </div>
        </div>
      </Modal>

      {/* View Modal - Read-only */}
      {selectedInvoice && (
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`${t('view')} ${t('invoice')}`}>
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
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('confirmDelete')}>
          <div className="space-y-4">
            <p>{t('confirmDelete')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                {t('delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

