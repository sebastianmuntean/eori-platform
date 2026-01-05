'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useContracts, Contract } from '@/hooks/useContracts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter, ClientFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { InvoiceTemplateEditor } from '@/components/contracts/InvoiceTemplateEditor';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function ContractsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.CONTRACTS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('contracts'));

  // All hooks must be called before any conditional returns
  const {
    contracts,
    loading,
    error,
    pagination,
    summary,
    fetchContracts,
    fetchSummary,
    createContract,
    updateContract,
    deleteContract,
    renewContract,
    fetchContractInvoices,
    generateInvoice,
  } = useContracts();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [contractInvoices, setContractInvoices] = useState<any[]>([]);
  const [invoicePeriod, setInvoicePeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [formData, setFormData] = useState({
    parishId: '',
    contractNumber: '',
    direction: 'incoming' as 'incoming' | 'outgoing',
    type: 'rental' as 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other',
    status: 'draft' as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed',
    clientId: '',
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    signingDate: '',
    amount: '',
    currency: 'RON',
    paymentFrequency: 'monthly' as 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'one_time' | 'custom',
    assetReference: '',
    description: '',
    terms: '',
    notes: '',
    renewalDate: '',
    autoRenewal: false,
    parentContractId: '',
    invoiceItemTemplate: null as any,
  });

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [permissionLoading, fetchParishes, fetchClients]);

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      direction: directionFilter || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      clientId: partnerFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'startDate',
      sortOrder: 'desc',
    };
    fetchContracts(params);
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [permissionLoading, currentPage, searchTerm, parishFilter, directionFilter, typeFilter, statusFilter, partnerFilter, dateFrom, dateTo, fetchContracts, fetchSummary]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.contractNumber || !formData.startDate || !formData.endDate || !formData.amount) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await createContract({
      ...formData,
      amount: formData.amount,
      invoiceItemTemplate: formData.invoiceItemTemplate || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedContract) return;

    if (!formData.parishId || !formData.contractNumber || !formData.startDate || !formData.endDate || !formData.amount) {
      alert(t('fillRequiredFields'));
      return;
    }

    // Prepare update data - only send fields that should be updated
    const updateData: any = {
      parishId: formData.parishId,
      contractNumber: formData.contractNumber,
      direction: formData.direction,
      type: formData.type,
      status: formData.status,
      clientId: formData.clientId,
      title: formData.title || null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      signingDate: formData.signingDate || null,
      amount: formData.amount,
      currency: formData.currency,
      paymentFrequency: formData.paymentFrequency,
      assetReference: formData.assetReference || null,
      description: formData.description || null,
      terms: formData.terms || null,
      notes: formData.notes || null,
      renewalDate: formData.renewalDate || null,
      autoRenewal: formData.autoRenewal,
      parentContractId: formData.parentContractId || null,
      invoiceItemTemplate: formData.invoiceItemTemplate || null,
    };

    const result = await updateContract(selectedContract.id, updateData);

    if (result) {
      setShowEditModal(false);
      setSelectedContract(null);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteContract(id);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      parishId: contract.parishId,
      contractNumber: contract.contractNumber,
      direction: contract.direction,
      type: contract.type,
      status: contract.status,
      clientId: contract.clientId,
      title: contract.title || '',
      startDate: contract.startDate,
      endDate: contract.endDate,
      signingDate: contract.signingDate || '',
      amount: contract.amount,
      currency: contract.currency,
      paymentFrequency: contract.paymentFrequency,
      assetReference: contract.assetReference || '',
      description: contract.description || '',
      terms: contract.terms || '',
      notes: contract.notes || '',
      renewalDate: contract.renewalDate || '',
      autoRenewal: contract.autoRenewal,
      parentContractId: contract.parentContractId || '',
      invoiceItemTemplate: (contract as any).invoiceItemTemplate || null,
    });
    setShowEditModal(true);
  };

  const handleRenew = async () => {
    if (!selectedContract) return;
    const result = await renewContract(selectedContract.id);
    if (result) {
      setShowRenewModal(false);
      setSelectedContract(null);
    }
  };

  const handleViewInvoices = async (contract: Contract) => {
    setSelectedContract(contract);
    const invoices = await fetchContractInvoices(contract.id);
    setContractInvoices(invoices);
    setShowInvoicesModal(true);
  };

  const handlePrintReport = () => {
    if (!selectedContract || contractInvoices.length === 0) return;

    const months = [
      t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
      t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
    ];

    const totalAmount = contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.amount || '0')), 0);
    const totalVat = contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.vat || '0')), 0);
    const totalSum = contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.total || '0')), 0);
    const currency = contractInvoices[0]?.invoice?.currency || selectedContract.currency || 'RON';

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('ro-RO');
    };

    const reportHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fișa Contract ${selectedContract.contractNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      padding: 20px;
      background: white;
    }
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    .header-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .header-info-item {
      display: flex;
      flex-direction: column;
    }
    .header-info-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header-info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
    }
    thead {
      background-color: #f5f5f5;
      border-bottom: 2px solid #333;
    }
    th {
      text-align: left;
      padding: 10px 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      color: #333;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    tbody tr:hover {
      background-color: #f9f9f9;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 30px;
      border-top: 2px solid #333;
      padding-top: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
    }
    .summary-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .summary-total {
      color: #16a34a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-paid {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-sent {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-draft {
      background-color: #f3f4f6;
      color: #374151;
    }
    .badge-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-cancelled {
      background-color: #fee2e2;
      color: #991b1b;
    }
    @media print {
      body {
        padding: 15px;
      }
      .no-print {
        display: none;
      }
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Fișa Contract ${selectedContract.contractNumber}</h1>
    <div style="margin-bottom: 15px;">
      <div class="header-info-item" style="margin-bottom: 10px;">
        <span class="header-info-label">${t('title') || 'Obiect'}</span>
        <span class="header-info-value">${selectedContract.title || '-'}</span>
      </div>
    </div>
    <div class="header-info">
      <div class="header-info-item">
        <span class="header-info-label">${t('contractNumber')}</span>
        <span class="header-info-value">${selectedContract.contractNumber}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('clients')}</span>
        <span class="header-info-value">${getClientName(selectedContract.clientId)}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('period') || 'Perioadă'}</span>
        <span class="header-info-value">${selectedContract.startDate ? formatDate(selectedContract.startDate) : '-'} - ${selectedContract.endDate ? formatDate(selectedContract.endDate) : '-'}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('amount')}</span>
        <span class="header-info-value">${formatCurrency(selectedContract.amount, selectedContract.currency)}</span>
      </div>
    </div>
    <div class="header-info" style="margin-top: 10px;">
      <div class="header-info-item">
        <span class="header-info-label">${t('status')}</span>
        <span class="header-info-value">${t(selectedContract.status)}</span>
      </div>
      <div class="header-info-item"></div>
      <div class="header-info-item"></div>
      <div class="header-info-item">
        <span class="header-info-label">Generat la</span>
        <span class="header-info-value">${new Date().toLocaleString('ro-RO')}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${t('period')}</th>
        <th>${t('invoiceNumber')}</th>
        <th>${t('date')}</th>
        <th>${t('dueDate')}</th>
        <th class="text-right">${t('amount')}</th>
        <th class="text-right">${t('vat')}</th>
        <th class="text-right">${t('total')}</th>
        <th>${t('status')}</th>
        <th>${t('paymentDate')}</th>
      </tr>
    </thead>
    <tbody>
      ${contractInvoices.map((ci: any) => {
        const statusClass = ci.invoice?.status === 'paid' ? 'badge-paid' :
                          ci.invoice?.status === 'sent' ? 'badge-sent' :
                          ci.invoice?.status === 'draft' ? 'badge-draft' :
                          ci.invoice?.status === 'overdue' ? 'badge-overdue' :
                          ci.invoice?.status === 'cancelled' ? 'badge-cancelled' : 'badge-draft';
        
        return `
        <tr>
          <td>${months[ci.periodMonth - 1] || ci.periodMonth} ${ci.periodYear}</td>
          <td>${ci.invoice?.invoiceNumber || '-'}</td>
          <td>${formatDate(ci.invoice?.date)}</td>
          <td>${formatDate(ci.invoice?.dueDate)}</td>
          <td class="text-right">${ci.invoice?.amount ? formatCurrency(ci.invoice.amount, currency) : '-'}</td>
          <td class="text-right">${ci.invoice?.vat ? formatCurrency(ci.invoice.vat, currency) : '-'}</td>
          <td class="text-right"><strong>${ci.invoice?.total ? formatCurrency(ci.invoice.total, currency) : '-'}</strong></td>
          <td><span class="badge ${statusClass}">${t(ci.invoice?.status || 'draft')}</span></td>
          <td>${formatDate(ci.invoice?.paymentDate)}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">${t('totalInvoices')}</span>
        <span class="summary-value">${contractInvoices.length}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalAmount')}</span>
        <span class="summary-value">${formatCurrency(totalAmount, currency)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalVat')}</span>
        <span class="summary-value">${formatCurrency(totalVat, currency)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalSum')}</span>
        <span class="summary-value summary-total">${formatCurrency(totalSum, currency)}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleGenerateInvoice = (contract: Contract) => {
    setSelectedContract(contract);
    setInvoicePeriod({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    setShowGenerateInvoiceModal(true);
  };

  const handleConfirmGenerateInvoice = async () => {
    if (!selectedContract) return;
    const result = await generateInvoice(selectedContract.id, invoicePeriod.year, invoicePeriod.month);
    if (result) {
      alert(t('contractRenewed') || 'Invoice generated successfully');
      setShowGenerateInvoiceModal(false);
      const invoices = await fetchContractInvoices(selectedContract.id);
      setContractInvoices(invoices);
    } else {
      alert(t('error') || 'Failed to generate invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      contractNumber: '',
      direction: 'incoming',
      type: 'rental',
      status: 'draft',
      clientId: '',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      signingDate: '',
      amount: '',
      currency: 'RON',
      paymentFrequency: 'monthly',
      assetReference: '',
      description: '',
      terms: '',
      notes: '',
      renewalDate: '',
      autoRenewal: false,
      parentContractId: '',
      invoiceItemTemplate: null,
    });
  };

  const formatCurrency = (amount: string | number, currency: string = 'RON') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find((c) => c.id === clientId);
    if (!client) return clientId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  };

  const columns: any[] = [
    {
      key: 'direction',
      label: 'IE',
      sortable: false,
      render: (_: any, row: Contract) => (
        <div className={`w-3 h-3 rounded-full ${row.direction === 'incoming' ? 'bg-success' : 'bg-info'}`} title={row.direction === 'incoming' ? t('incoming') : t('outgoing')} />
      ),
    },
    {
      key: 'type',
      label: t('type'),
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {t(value) || value}
        </Badge>
      ),
    },
    {
      key: 'clientId',
      label: t('parteneri'),
      sortable: false,
      render: (value: string) => getClientName(value),
    },
    { key: 'startDate', label: t('startDate'), sortable: true },
    { key: 'endDate', label: t('endDate'), sortable: true },
    {
      key: 'amount',
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Contract) => formatCurrency(value, row.currency),
    },
    {
      key: 'status',
      label: t('status'),
      sortable: false,
      render: (value: string) => {
        const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
          draft: 'secondary',
          active: 'success',
          expired: 'warning',
          terminated: 'danger',
          renewed: 'info',
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
      render: (_: any, row: Contract) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            ...(row.status === 'active' ? [{ label: t('generateInvoice'), onClick: () => handleGenerateInvoice(row) }] : []),
            { label: t('viewInvoices'), onClick: () => handleViewInvoices(row) },
            { label: t('renew'), onClick: () => { setSelectedContract(row); setShowRenewModal(true); } },
            { label: t('edit'), onClick: () => handleEdit(row) },
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
    { label: t('contracts') },
  ];

  const ContractFormFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label={`${t('parish')} *`}
          value={formData.parishId}
          onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          placeholder={t('selectParish')}
          required
        />
        <Input
          label={`${t('contractNumber')} *`}
          value={formData.contractNumber}
          onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
          required
        />
        <Select
          label={`${t('direction')} *`}
          value={formData.direction}
          onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'incoming' | 'outgoing' })}
          options={[
            { value: 'incoming', label: t('incoming') },
            { value: 'outgoing', label: t('outgoing') },
          ]}
          required
        />
        <Select
          label={`${t('type')} *`}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          options={[
            { value: 'rental', label: t('rental') },
            { value: 'concession', label: t('concession') },
            { value: 'sale_purchase', label: t('salePurchase') },
            { value: 'loan', label: t('loan') },
            { value: 'other', label: t('other') },
          ]}
          required
        />
        <ClientSelect
          label={t('parteneri')}
          value={formData.clientId}
          onChange={(value) => setFormData({ ...formData, clientId: value })}
          clients={clients}
          onlyCompanies={false}
          placeholder={t('selectPartner')}
          required
        />
        <Input label={t('title')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Input
          type="date"
          label={`${t('startDate')} *`}
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
        <Input
          type="date"
          label={`${t('endDate')} *`}
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          required
        />
        <Input
          type="date"
          label={t('signingDate')}
          value={formData.signingDate}
          onChange={(e) => setFormData({ ...formData, signingDate: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          label={`${t('amount')} *`}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <Input label={t('currency')} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
        <Select
          label={`${t('paymentFrequency')} *`}
          value={formData.paymentFrequency}
          onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value as any })}
          options={[
            { value: 'monthly', label: t('monthly') },
            { value: 'quarterly', label: t('quarterly') },
            { value: 'semiannual', label: t('semiannual') },
            { value: 'annual', label: t('annual') },
            { value: 'one_time', label: t('oneTime') },
            { value: 'custom', label: t('custom') },
          ]}
          required
        />
        <Input
          label={t('assetReference')}
          value={formData.assetReference}
          onChange={(e) => setFormData({ ...formData, assetReference: e.target.value })}
        />
        <Select
          label={t('status')}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={[
            { value: 'draft', label: t('draft') },
            { value: 'active', label: t('active') },
            { value: 'expired', label: t('expired') },
            { value: 'terminated', label: t('terminated') },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('terms')}</label>
          <textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{t('invoiceItemTemplate')}</h3>
        <p className="text-sm text-text-secondary mb-4">{t('invoiceItemTemplateDescription')}</p>
        <InvoiceTemplateEditor
          template={formData.invoiceItemTemplate}
          onChange={(template) => setFormData({ ...formData, invoiceItemTemplate: template })}
        />
      </div>
    </>
  );

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('contracts')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('contract')}</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated">
            <CardBody>
              <p className="text-sm text-text-secondary mb-1">{t('active')}</p>
              <p className="text-2xl font-bold text-success">{summary.totalActive || 0}</p>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <p className="text-sm text-text-secondary mb-1">{t('expired')}</p>
              <p className="text-2xl font-bold text-warning">{summary.totalExpired || 0}</p>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <p className="text-sm text-text-secondary mb-1">{t('terminated')}</p>
              <p className="text-2xl font-bold text-danger">{summary.totalTerminated || 0}</p>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <p className="text-sm text-text-secondary mb-1">{t('expiringIn90Days') || 'Expiring in 90 days'}</p>
              <p className="text-2xl font-bold text-warning">{summary.expiringIn90Days || 0}</p>
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
            <ParishFilter value={parishFilter} onChange={(v) => { setParishFilter(v); setCurrentPage(1); }} parishes={parishes} />
            <FilterSelect
              label={t('direction')}
              value={directionFilter}
              onChange={(v) => { setDirectionFilter(v); setCurrentPage(1); }}
              options={[
                { value: 'incoming', label: t('incoming') },
                { value: 'outgoing', label: t('outgoing') },
              ]}
            />
            <TypeFilter
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
              types={[
                { value: 'rental', label: t('rental') },
                { value: 'concession', label: t('concession') },
                { value: 'sale_purchase', label: t('salePurchase') },
                { value: 'loan', label: t('loan') },
                { value: 'other', label: t('other') },
              ]}
            />
            <StatusFilter
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              statuses={[
                { value: 'draft', label: t('draft') },
                { value: 'active', label: t('active') },
                { value: 'expired', label: t('expired') },
                { value: 'terminated', label: t('terminated') },
              ]}
            />
            <ClientFilter value={partnerFilter} onChange={(v) => { setPartnerFilter(v); setCurrentPage(1); }} clients={clients} />
            <FilterDate label={t('dateFrom')} value={dateFrom} onChange={(v) => { setDateFrom(v); setCurrentPage(1); }} />
            <FilterDate label={t('dateTo')} value={dateTo} onChange={(v) => { setDateTo(v); setCurrentPage(1); }} />
            <FilterClear
              onClear={() => {
                setSearchTerm('');
                setParishFilter('');
                setDirectionFilter('');
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
              <Table data={contracts} columns={columns} />
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

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCancel={() => setShowAddModal(false)}
        title={`${t('add')} ${t('contract')}`}
        onSubmit={handleCreate}
        isSubmitting={false}
        submitLabel={t('create')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <ContractFormFields />
      </FormModal>

      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCancel={() => setShowEditModal(false)}
        title={`${t('edit')} ${t('contract')}`}
        onSubmit={handleUpdate}
        isSubmitting={false}
        submitLabel={t('update')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <ContractFormFields />
      </FormModal>

      <SimpleModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title={t('renew')}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowRenewModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleRenew}>{t('renew')}</Button>
          </>
        }
      >
        <p>{t('confirmRenew') || 'Are you sure you want to renew this contract?'}</p>
      </SimpleModal>

      <SimpleModal
        isOpen={showInvoicesModal}
        onClose={() => setShowInvoicesModal(false)}
        title={selectedContract ? `Fișa Contract ${selectedContract.contractNumber}` : 'Fișa Contract'}
        size="full"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #invoices-print-content,
              #invoices-print-content * {
                visibility: visible;
              }
              #invoices-print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              button {
                display: none !important;
              }
            }
          `
        }} />
        <div className="space-y-6" id="invoices-print-content">
          <div className="flex justify-end mb-4 print:hidden">
            <Button onClick={handlePrintReport} variant="outline" disabled={contractInvoices.length === 0}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('printReport') || 'Tipărește Raport'}
            </Button>
          </div>
          {selectedContract && (
            <div className="bg-bg-secondary rounded-lg p-4 border border-border">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('contractNumber')}</p>
                    <p className="font-medium text-text-primary">{selectedContract.contractNumber}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('title') || 'Obiect'}</p>
                    <p className="font-medium text-text-primary">{selectedContract.title || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('parteneri')}</p>
                    <p className="font-medium text-text-primary">{getClientName(selectedContract.clientId)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('period') || 'Perioadă'}</p>
                    <p className="font-medium text-text-primary">
                      {selectedContract.startDate ? new Date(selectedContract.startDate).toLocaleDateString('ro-RO') : '-'} - {selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString('ro-RO') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('amount')}</p>
                    <p className="font-medium text-text-primary">{formatCurrency(selectedContract.amount, selectedContract.currency)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('status')}</p>
                    <Badge variant={selectedContract.status === 'active' ? 'success' : selectedContract.status === 'terminated' ? 'danger' : 'secondary'} size="sm">
                      {t(selectedContract.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {contractInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">{t('noInvoices')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table
                  data={contractInvoices}
                  columns={[
                    {
                      key: 'period',
                      label: t('period') || 'Perioadă',
                      render: (value: any, row: any) => {
                        const months = [
                          t('january') || 'Ianuarie', t('february') || 'Februarie', t('march') || 'Martie',
                          t('april') || 'Aprilie', t('may') || 'Mai', t('june') || 'Iunie',
                          t('july') || 'Iulie', t('august') || 'August', t('september') || 'Septembrie',
                          t('october') || 'Octombrie', t('november') || 'Noiembrie', t('december') || 'Decembrie'
                        ];
                        return `${months[row.periodMonth - 1] || row.periodMonth} ${row.periodYear}`;
                      },
                    },
                    {
                      key: 'invoiceNumber',
                      label: t('invoiceNumber'),
                      render: (value: any, row: any) => row.invoice?.invoiceNumber || '-',
                    },
                    {
                      key: 'date',
                      label: t('date'),
                      render: (value: any, row: any) => row.invoice?.date ? new Date(row.invoice.date).toLocaleDateString('ro-RO') : '-',
                    },
                    {
                      key: 'dueDate',
                      label: t('dueDate') || 'Scadență',
                      render: (value: any, row: any) => row.invoice?.dueDate ? new Date(row.invoice.dueDate).toLocaleDateString('ro-RO') : '-',
                    },
                    {
                      key: 'amount',
                      label: t('amount') || 'Valoare',
                      render: (value: any, row: any) => row.invoice?.amount ? formatCurrency(row.invoice.amount, row.invoice?.currency || 'RON') : '-',
                    },
                    {
                      key: 'vat',
                      label: t('vat') || 'TVA',
                      render: (value: any, row: any) => row.invoice?.vat ? formatCurrency(row.invoice.vat, row.invoice?.currency || 'RON') : '-',
                    },
                    {
                      key: 'total',
                      label: t('total'),
                      render: (value: any, row: any) => row.invoice?.total ? (
                        <span className="font-semibold">{formatCurrency(row.invoice.total, row.invoice?.currency || 'RON')}</span>
                      ) : '-',
                    },
                    {
                      key: 'status',
                      label: t('status'),
                      render: (value: any, row: any) => {
                        const status = row.invoice?.status;
                        if (!status) return '-';
                        const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
                          draft: 'secondary',
                          sent: 'info',
                          paid: 'success',
                          overdue: 'danger',
                          cancelled: 'danger',
                        };
                        return (
                          <Badge variant={variantMap[status] || 'secondary'} size="sm">
                            {t(status)}
                          </Badge>
                        );
                      },
                    },
                    {
                      key: 'paymentDate',
                      label: t('paymentDate') || 'Data plată',
                      render: (value: any, row: any) => row.invoice?.paymentDate ? new Date(row.invoice.paymentDate).toLocaleDateString('ro-RO') : (
                        <span className="text-text-secondary">-</span>
                      ),
                    },
                    {
                      key: 'generatedAt',
                      label: t('generatedAt') || 'Generat la',
                      render: (value: any, row: any) => row.generatedAt ? new Date(row.generatedAt).toLocaleString('ro-RO') : '-',
                    },
                  ]}
                />
              </div>
              
              {contractInvoices.length > 0 && (
                <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalInvoices') || 'Total facturi'}</p>
                      <p className="text-lg font-semibold text-text-primary">{contractInvoices.length}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalAmount') || 'Total valoare'}</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.amount || '0')), 0),
                          contractInvoices[0]?.invoice?.currency || 'RON'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalVat') || 'Total TVA'}</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.vat || '0')), 0),
                          contractInvoices[0]?.invoice?.currency || 'RON'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalSum') || 'Total general'}</p>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(
                          contractInvoices.reduce((sum, ci) => sum + (parseFloat(ci.invoice?.total || '0')), 0),
                          contractInvoices[0]?.invoice?.currency || 'RON'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SimpleModal>

      {selectedContract && (
        <FormModal
          isOpen={showGenerateInvoiceModal}
          onClose={() => setShowGenerateInvoiceModal(false)}
          onCancel={() => setShowGenerateInvoiceModal(false)}
          title={`${t('generateInvoice')} - ${selectedContract.contractNumber}`}
          onSubmit={handleConfirmGenerateInvoice}
          isSubmitting={loading}
          submitLabel={loading ? t('generating') || 'Generating...' : t('generate')}
          cancelLabel={t('cancel')}
        >
          <div className="space-y-4">
            <Input
              type="number"
              label={`${t('year')} *`}
              value={invoicePeriod.year}
              onChange={(e) => setInvoicePeriod({ ...invoicePeriod, year: parseInt(e.target.value) || new Date().getFullYear() })}
              min={2000}
              max={2100}
              required
            />
            <Input
              type="number"
              label={`${t('month')} *`}
              value={invoicePeriod.month}
              onChange={(e) => setInvoicePeriod({ ...invoicePeriod, month: parseInt(e.target.value) || 1 })}
              min={1}
              max={12}
              required
            />
          </div>
        </FormModal>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDeleteMessage') || 'Are you sure you want to delete this contract?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
      />
    </div>
  );
}
