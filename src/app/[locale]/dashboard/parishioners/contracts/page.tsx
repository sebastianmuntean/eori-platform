'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useParishionerContracts, ParishionerContract, ParishionerContractStatus, ParishionerContractType } from '@/hooks/useParishionerContracts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

const PAGE_SIZE = 10;

export default function ParishionerContractsPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.CONTRACTS_VIEW);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('contracts'));

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const {
    contracts,
    loading,
    error,
    pagination,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  } = useParishionerContracts();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParishionerContractStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ParishionerContract | null>(null);
  const [formData, setFormData] = useState({
    contractNumber: '',
    parishionerId: '',
    parishId: '',
    contractType: 'donation' as ParishionerContractType,
    status: 'draft' as ParishionerContractStatus,
    title: '',
    startDate: '',
    endDate: '',
    signingDate: '',
    amount: '',
    currency: 'RON',
    terms: '',
    description: '',
    notes: '',
    renewalDate: '',
    autoRenewal: false,
  });

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  useEffect(() => {
    fetchContracts({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      status: statusFilter || undefined,
      sortBy: 'startDate',
      sortOrder: 'desc',
    });
  }, [currentPage, searchTerm, parishFilter, statusFilter, fetchContracts]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.parishionerId || !formData.contractNumber || !formData.startDate) {
      alert(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const result = await createContract({
      ...formData,
      amount: formData.amount || null,
      signingDate: formData.signingDate || null,
      renewalDate: formData.renewalDate || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedContract) return;

    const result = await updateContract(selectedContract.id, {
      ...formData,
      amount: formData.amount || null,
      signingDate: formData.signingDate || null,
      renewalDate: formData.renewalDate || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedContract(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this contract?')) {
      const success = await deleteContract(id);
      if (success) {
        fetchContracts({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          parishId: parishFilter || undefined,
          status: statusFilter || undefined,
        });
      }
    }
  };

  const handleEdit = (contract: ParishionerContract) => {
    setSelectedContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      parishionerId: contract.parishionerId,
      parishId: contract.parishId,
      contractType: contract.contractType,
      status: contract.status,
      title: contract.title || '',
      startDate: contract.startDate,
      endDate: contract.endDate || '',
      signingDate: contract.signingDate || '',
      amount: contract.amount || '',
      currency: contract.currency,
      terms: contract.terms || '',
      description: contract.description || '',
      notes: contract.notes || '',
      renewalDate: contract.renewalDate || '',
      autoRenewal: contract.autoRenewal,
    });
    setShowEditModal(true);
  };

  const handleView = (id: string) => {
    router.push(`/${locale}/dashboard/parishioners/contracts/${id}`);
  };

  const resetForm = () => {
    setFormData({
      contractNumber: '',
      parishionerId: '',
      parishId: '',
      contractType: 'donation',
      status: 'draft',
      title: '',
      startDate: '',
      endDate: '',
      signingDate: '',
      amount: '',
      currency: 'RON',
      terms: '',
      description: '',
      notes: '',
      renewalDate: '',
      autoRenewal: false,
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
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
      key: 'contractNumber',
      label: t('contractNumber') || 'Contract Number',
      sortable: true,
    },
    {
      key: 'startDate',
      label: t('startDate') || 'Start Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'parishionerId',
      label: t('parishioner') || 'Parishioner',
      sortable: false,
      render: (_: any, row: ParishionerContract) => getParishionerName(row.parishionerId),
    },
    {
      key: 'contractType',
      label: t('type') || 'Type',
      sortable: false,
      render: (value: ParishionerContractType) => (
        <Badge variant="secondary" size="sm">
          {t(value) || value}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: ParishionerContractStatus) => {
        const variantMap: Record<ParishionerContractStatus, 'warning' | 'success' | 'danger' | 'secondary'> = {
          draft: 'warning',
          active: 'success',
          expired: 'secondary',
          terminated: 'danger',
          renewed: 'success',
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
      render: (_: any, row: ParishionerContract) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('view') || 'View', onClick: () => handleView(row.id) },
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
    { label: t('contracts') || 'Contracts' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('contracts') || 'Parishioner Contracts'}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {t('add')} {t('contract') || 'Contract'}
        </Button>
      </div>

      {/* Filters */}
      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                setStatusFilter(e.target.value as ParishionerContractStatus | '');
                setCurrentPage(1);
              }}
            >
              <option value="">{t('allStatuses') || 'All Statuses'}</option>
              <option value="draft">{t('draft') || 'Draft'}</option>
              <option value="active">{t('active') || 'Active'}</option>
              <option value="expired">{t('expired') || 'Expired'}</option>
              <option value="terminated">{t('terminated') || 'Terminated'}</option>
              <option value="renewed">{t('renewed') || 'Renewed'}</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Contracts Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          <Table
            data={contracts}
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

      {/* Add/Edit Modals - Similar structure to receipts page */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add')} ${t('contract') || 'Contract'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">{t('contractNumber') || 'Contract Number'} *</label>
            <Input
              value={formData.contractNumber}
              onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">{t('contractType') || 'Contract Type'} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.contractType}
              onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ParishionerContractType })}
              required
            >
              <option value="donation">{t('donation') || 'Donation'}</option>
              <option value="service">{t('service') || 'Service'}</option>
              <option value="rental">{t('rental') || 'Rental'}</option>
              <option value="other">{t('other') || 'Other'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('title') || 'Title'}</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('startDate') || 'Start Date'} *</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('endDate') || 'End Date'}</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('signingDate') || 'Signing Date'}</label>
            <Input
              type="date"
              value={formData.signingDate}
              onChange={(e) => setFormData({ ...formData, signingDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('amount') || 'Amount'}</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">{t('terms') || 'Terms'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('description') || 'Description'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
          <div>
            <label className="block text-sm font-medium mb-1">{t('renewalDate') || 'Renewal Date'}</label>
            <Input
              type="date"
              value={formData.renewalDate}
              onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
              />
              {t('autoRenewal') || 'Auto Renewal'}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContract(null);
        }}
        title={`${t('edit')} ${t('contract') || 'Contract'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">{t('contractNumber') || 'Contract Number'} *</label>
            <Input
              value={formData.contractNumber}
              onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">{t('contractType') || 'Contract Type'} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.contractType}
              onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ParishionerContractType })}
              required
            >
              <option value="donation">{t('donation') || 'Donation'}</option>
              <option value="service">{t('service') || 'Service'}</option>
              <option value="rental">{t('rental') || 'Rental'}</option>
              <option value="other">{t('other') || 'Other'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('status')}</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ParishionerContractStatus })}
            >
              <option value="draft">{t('draft') || 'Draft'}</option>
              <option value="active">{t('active') || 'Active'}</option>
              <option value="expired">{t('expired') || 'Expired'}</option>
              <option value="terminated">{t('terminated') || 'Terminated'}</option>
              <option value="renewed">{t('renewed') || 'Renewed'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('title') || 'Title'}</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('startDate') || 'Start Date'} *</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('endDate') || 'End Date'}</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('signingDate') || 'Signing Date'}</label>
            <Input
              type="date"
              value={formData.signingDate}
              onChange={(e) => setFormData({ ...formData, signingDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('amount') || 'Amount'}</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">{t('terms') || 'Terms'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('description') || 'Description'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
          <div>
            <label className="block text-sm font-medium mb-1">{t('renewalDate') || 'Renewal Date'}</label>
            <Input
              type="date"
              value={formData.renewalDate}
              onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
              />
              {t('autoRenewal') || 'Auto Renewal'}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedContract(null); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

