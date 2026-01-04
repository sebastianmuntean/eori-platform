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
import { useReceipts, Receipt, ReceiptStatus } from '@/hooks/useReceipts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

export default function ReceiptsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    receipts,
    loading,
    error,
    pagination,
    fetchReceipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getNextReceiptNumber,
  } = useReceipts();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [formData, setFormData] = useState({
    receiptNumber: '',
    parishionerId: '',
    parishId: '',
    receiptDate: '',
    amount: '',
    currency: 'RON',
    purpose: '',
    paymentMethod: '',
    status: 'draft' as ReceiptStatus,
    notes: '',
  });

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  useEffect(() => {
    fetchReceipts({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'receiptDate',
      sortOrder: 'desc',
    });
  }, [currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo, fetchReceipts]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.parishionerId || !formData.receiptNumber || !formData.receiptDate || !formData.amount) {
      alert(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const result = await createReceipt({
      ...formData,
      amount: formData.amount,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedReceipt) return;

    const result = await updateReceipt(selectedReceipt.id, {
      ...formData,
      amount: formData.amount,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedReceipt(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this receipt?')) {
      const success = await deleteReceipt(id);
      if (success) {
        fetchReceipts({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          parishId: parishFilter || undefined,
          status: statusFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
      }
    }
  };

  const handleEdit = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setFormData({
      receiptNumber: receipt.receiptNumber,
      parishionerId: receipt.parishionerId,
      parishId: receipt.parishId,
      receiptDate: receipt.receiptDate,
      amount: receipt.amount,
      currency: receipt.currency,
      purpose: receipt.purpose || '',
      paymentMethod: receipt.paymentMethod || '',
      status: receipt.status,
      notes: receipt.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      receiptNumber: '',
      parishionerId: '',
      parishId: '',
      receiptDate: '',
      amount: '',
      currency: 'RON',
      purpose: '',
      paymentMethod: '',
      status: 'draft',
      notes: '',
    });
  };

  const handleGenerateReceiptNumber = async () => {
    const nextNumber = await getNextReceiptNumber(formData.parishId || undefined);
    if (nextNumber) {
      setFormData({ ...formData, receiptNumber: nextNumber });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const formatAmount = (amount: string, currency: string) => {
    return `${amount} ${currency}`;
  };

  const getParishionerName = (parishionerId: string) => {
    const client = clients.find((c) => c.id === parishionerId);
    if (!client) return parishionerId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  };

  const getParishName = (parishId: string) => {
    const parish = parishes.find((p) => p.id === parishId);
    return parish ? parish.name : parishId;
  };

  const columns = [
    {
      key: 'receiptNumber',
      label: t('receiptNumber') || 'Receipt Number',
      sortable: true,
    },
    {
      key: 'receiptDate',
      label: t('date') || 'Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'parishionerId',
      label: t('parishioner') || 'Parishioner',
      sortable: false,
      render: (_: any, row: Receipt) => getParishionerName(row.parishionerId),
    },
    {
      key: 'parishId',
      label: t('parish') || 'Parish',
      sortable: false,
      render: (_: any, row: Receipt) => getParishName(row.parishId),
    },
    {
      key: 'amount',
      label: t('amount') || 'Amount',
      sortable: true,
      render: (_: any, row: Receipt) => formatAmount(row.amount, row.currency),
    },
    {
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: ReceiptStatus) => {
        const variantMap: Record<ReceiptStatus, 'warning' | 'success' | 'danger'> = {
          draft: 'warning',
          issued: 'success',
          cancelled: 'danger',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value) || value}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Receipt) => (
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
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
    { label: t('receipts') || 'Receipts' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('receipts') || 'Receipts'}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {t('add')} {t('receipt') || 'Receipt'}
        </Button>
      </div>

      {/* Filters */}
      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">{t('allParishes') || 'All Parishes'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReceiptStatus | '');
                setCurrentPage(1);
              }}
            >
              <option value="">{t('allStatuses') || 'All Statuses'}</option>
              <option value="draft">{t('draft') || 'Draft'}</option>
              <option value="issued">{t('issued') || 'Issued'}</option>
              <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>
            </select>
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              placeholder={t('dateFrom') || 'Date From'}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Input
              type="date"
              placeholder={t('dateTo') || 'Date To'}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Receipts Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          <Table
            data={receipts}
            columns={columns}
            loading={loading}
            pagination={pagination ? {
              currentPage: pagination.page,
              totalPages: pagination.totalPages,
              onPageChange: setCurrentPage,
            } : undefined}
          />
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add')} ${t('receipt') || 'Receipt'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">{t('receiptNumber') || 'Receipt Number'} *</label>
            <div className="flex gap-2">
              <Input
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                required
              />
              <Button variant="outline" onClick={handleGenerateReceiptNumber} disabled={!formData.parishId}>
                {t('generate') || 'Generate'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              required
            >
              <option value="">{t('selectParish') || 'Select Parish'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('parishioner')} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishionerId}
              onChange={(e) => setFormData({ ...formData, parishionerId: e.target.value })}
              required
            >
              <option value="">{t('selectParishioner') || 'Select Parishioner'}</option>
              {clients.filter((c) => c.isParishioner || c.id === formData.parishionerId).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('date')} *</label>
            <Input
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('amount')} *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('currency') || 'Currency'}</label>
            <Input
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              maxLength={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('purpose') || 'Purpose'}</label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('paymentMethod') || 'Payment Method'}</label>
            <Input
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('status')}</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ReceiptStatus })}
            >
              <option value="draft">{t('draft') || 'Draft'}</option>
              <option value="issued">{t('issued') || 'Issued'}</option>
              <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('notes')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedReceipt(null);
        }}
        title={`${t('edit')} ${t('receipt') || 'Receipt'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">{t('receiptNumber') || 'Receipt Number'} *</label>
            <Input
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              required
            >
              <option value="">{t('selectParish') || 'Select Parish'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('parishioner')} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishionerId}
              onChange={(e) => setFormData({ ...formData, parishionerId: e.target.value })}
              required
            >
              <option value="">{t('selectParishioner') || 'Select Parishioner'}</option>
              {clients.filter((c) => c.isParishioner || c.id === formData.parishionerId).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('date')} *</label>
            <Input
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('amount')} *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('currency') || 'Currency'}</label>
            <Input
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              maxLength={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('purpose') || 'Purpose'}</label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('paymentMethod') || 'Payment Method'}</label>
            <Input
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('status')}</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ReceiptStatus })}
            >
              <option value="draft">{t('draft') || 'Draft'}</option>
              <option value="issued">{t('issued') || 'Issued'}</option>
              <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('notes')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedReceipt(null); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

