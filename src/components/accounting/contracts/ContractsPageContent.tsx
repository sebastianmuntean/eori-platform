'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Table } from '@/components/ui/Table';
import { ToastContainer } from '@/components/ui/Toast';
import { useContracts, Contract, ContractInvoice } from '@/hooks/useContracts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { ContractAddModal, ContractFormData } from '@/components/accounting/ContractAddModal';
import { ContractEditModal } from '@/components/accounting/ContractEditModal';
import { DeleteContractDialog } from '@/components/accounting/DeleteContractDialog';
import { ContractsFiltersCard } from '@/components/accounting/ContractsFiltersCard';
import { ContractsTableCard } from '@/components/accounting/ContractsTableCard';
import { FormModal } from '@/components/accounting/FormModal';
import { PageContainer } from '@/components/ui/PageContainer';
import { useContractInvoiceGeneration } from '@/hooks/useContractInvoiceGeneration';
import { ContractReportPrint } from './ContractReportPrint';
import { useContractInvoiceTableColumns } from './ContractInvoiceTableColumns';
import {
  createEmptyContractFormData,
  contractToFormData,
  getClientNameById,
  validateContractForm,
  prepareContractUpdateData,
} from '@/lib/utils/contracts';
import { formatCurrency } from '@/lib/utils/accounting';

const PAGE_SIZE = 10;

interface ContractsPageContentProps {
  locale: string;
}

/**
 * Contracts page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function ContractsPageContent({ locale }: ContractsPageContentProps) {
  const t = useTranslations('common');
  const { toasts, success, error: showError, removeToast } = useToast();
  const invoiceTableColumns = useContractInvoiceTableColumns();

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
    generateInvoice: generateInvoiceFn,
  } = useContracts();

  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
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
  const [contractInvoices, setContractInvoices] = useState<ContractInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>(createEmptyContractFormData());

  const { invoicePeriod, setInvoicePeriod, generateInvoice, isGenerating } = useContractInvoiceGeneration(
    generateInvoiceFn,
    fetchContractInvoices
  );

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      direction: (directionFilter || undefined) as 'incoming' | 'outgoing' | undefined,
      type: (typeFilter || undefined) as 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other' | undefined,
      status: (statusFilter || undefined) as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed' | undefined,
      clientId: clientFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'startDate' as const,
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, parishFilter, directionFilter, typeFilter, statusFilter, clientFilter, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchContracts(fetchParams);
    fetchSummary({
      parishId: parishFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [fetchParams, parishFilter, dateFrom, dateTo, fetchContracts, fetchSummary]);

  const handleCreate = useCallback(async () => {
    const validation = validateContractForm(formData);
    if (!validation.isValid) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    const result = await createContract({
      ...formData,
      amount: formData.amount,
      invoiceItemTemplate: formData.invoiceItemTemplate || null,
    });

    if (result) {
      success(t('contractCreated') || 'Contract created successfully');
      setShowAddModal(false);
      resetForm();
    } else {
      showError(t('errorCreatingContract') || 'Failed to create contract');
    }
  }, [formData, createContract, t, showError, success]);

  const handleFormDataChange = useCallback((data: Partial<ContractFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!selectedContract) return;

    const validation = validateContractForm(formData);
    if (!validation.isValid) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    const updateData = prepareContractUpdateData(formData);
    const result = await updateContract(selectedContract.id, updateData);

    if (result) {
      success(t('contractUpdated') || 'Contract updated successfully');
      setShowEditModal(false);
      setSelectedContract(null);
    } else {
      showError(t('errorUpdatingContract') || 'Failed to update contract');
    }
  }, [selectedContract, formData, updateContract, t, showError, success]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteContract(id);
      if (result) {
        success(t('contractDeleted') || 'Contract deleted successfully');
        setDeleteConfirm(null);
      } else {
        showError(t('errorDeletingContract') || 'Failed to delete contract');
      }
    },
    [deleteContract, success, showError, t]
  );

  const handleEdit = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setFormData(contractToFormData(contract));
    setShowEditModal(true);
  }, []);

  const handleRenew = useCallback(async () => {
    if (!selectedContract) return;
    const result = await renewContract(selectedContract.id);
    if (result) {
      success(t('contractRenewed') || 'Contract renewed successfully');
      setShowRenewModal(false);
      setSelectedContract(null);
    } else {
      showError(t('errorRenewingContract') || 'Failed to renew contract');
    }
  }, [selectedContract, renewContract, success, showError, t]);

  const handleViewInvoices = useCallback(
    async (contract: Contract) => {
      setSelectedContract(contract);
      setIsLoadingInvoices(true);
      try {
        const invoices = await fetchContractInvoices(contract.id);
        setContractInvoices(invoices);
        setShowInvoicesModal(true);
      } catch (error) {
        showError(t('errorLoadingInvoices') || 'Failed to load invoices');
      } finally {
        setIsLoadingInvoices(false);
      }
    },
    [fetchContractInvoices, showError, t]
  );

  const handleGenerateInvoice = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setInvoicePeriod({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    setShowGenerateInvoiceModal(true);
  }, [setInvoicePeriod]);

  const handleConfirmGenerateInvoice = useCallback(async () => {
    if (!selectedContract) return;
    await generateInvoice(
      selectedContract,
      invoicePeriod.year,
      invoicePeriod.month,
      () => {
        success(t('invoiceGenerated') || 'Invoice generated successfully');
        setShowGenerateInvoiceModal(false);
        handleViewInvoices(selectedContract);
      },
      (error) => {
        showError(error || t('errorGeneratingInvoice') || 'Failed to generate invoice');
      }
    );
  }, [selectedContract, invoicePeriod, generateInvoice, handleViewInvoices, t, success, showError]);

  const resetForm = useCallback(() => {
    setFormData(createEmptyContractFormData());
  }, []);

  // Memoized filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDirectionFilterChange = useCallback((value: string) => {
    setDirectionFilter(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClientFilterChange = useCallback((value: string) => {
    setClientFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setDirectionFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'direction',
        label: 'IE',
        sortable: false,
        render: (_: any, row: Contract) => (
          <div
            className={`w-3 h-3 rounded-full ${row.direction === 'incoming' ? 'bg-success' : 'bg-info'}`}
            title={row.direction === 'incoming' ? t('incoming') : t('outgoing')}
          />
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
        label: t('clients'),
        sortable: false,
        render: (value: string) => getClientNameById(value, clients),
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
              ...(row.status === 'active'
                ? [{ label: t('generateInvoice'), onClick: () => handleGenerateInvoice(row) }]
                : []),
              { label: t('viewInvoices'), onClick: () => handleViewInvoices(row) },
              {
                label: t('renew'),
                onClick: () => {
                  setSelectedContract(row);
                  setShowRenewModal(true);
                },
              },
              { label: t('edit'), onClick: () => handleEdit(row) },
              { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, clients, formatCurrency, handleGenerateInvoice, handleViewInvoices, handleEdit]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('contracts') },
        ]}
        title={t('contracts')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('contract')}</Button>}
      />

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

      <ContractsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        directionFilter={directionFilter}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        clientFilter={clientFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        clients={clients}
        onSearchChange={handleSearchChange}
        onParishFilterChange={handleParishFilterChange}
        onDirectionFilterChange={handleDirectionFilterChange}
        onTypeFilterChange={handleTypeFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onClientFilterChange={handleClientFilterChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearFilters={handleClearFilters}
      />

      <ContractsTableCard
        data={contracts}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No contracts available'}
      />

      <ContractAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        parishes={parishes}
        clients={clients}
        onSubmit={handleCreate}
        isSubmitting={false}
      />

      <ContractEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContract(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedContract(null);
        }}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        parishes={parishes}
        clients={clients}
        onSubmit={handleUpdate}
        isSubmitting={false}
      />

      <SimpleModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title={t('renew')}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowRenewModal(false)}>
              {t('cancel')}
            </Button>
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
        <style
          dangerouslySetInnerHTML={{
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
          `,
          }}
        />
        <div className="space-y-6" id="invoices-print-content">
          <div className="flex justify-end mb-4 print:hidden">
            {selectedContract && (
              <ContractReportPrint
                contract={selectedContract}
                contractInvoices={contractInvoices}
                clients={clients}
              />
            )}
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
                    <p className="text-text-secondary text-xs mb-1">{t('clients')}</p>
                    <p className="font-medium text-text-primary">{getClientNameById(selectedContract.clientId, clients)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('period') || 'Perioadă'}</p>
                    <p className="font-medium text-text-primary">
                      {selectedContract.startDate
                        ? new Date(selectedContract.startDate).toLocaleDateString('ro-RO')
                        : '-'}{' '}
                      -{' '}
                      {selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString('ro-RO') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('amount')}</p>
                    <p className="font-medium text-text-primary">
                      {formatCurrency(selectedContract.amount, selectedContract.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-1">{t('status')}</p>
                    <Badge
                      variant={
                        selectedContract.status === 'active'
                          ? 'success'
                          : selectedContract.status === 'terminated'
                            ? 'danger'
                            : 'secondary'
                      }
                      size="sm"
                    >
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
                {isLoadingInvoices ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">{t('loading') || 'Loading...'}</p>
                  </div>
                ) : (
                  <Table data={contractInvoices} columns={invoiceTableColumns} />
                )}
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
                          contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.amount || '0'), 0),
                          contractInvoices[0]?.invoice?.currency || 'RON'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalVat') || 'Total TVA'}</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.vat || '0'), 0),
                          contractInvoices[0]?.invoice?.currency || 'RON'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs mb-1">{t('totalSum') || 'Total general'}</p>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(
                          contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.total || '0'), 0),
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
          isSubmitting={isGenerating}
          submitLabel={isGenerating ? t('generating') || 'Generating...' : t('generate')}
          cancelLabel={t('cancel')}
        >
          <div className="space-y-4">
            <Input
              type="number"
              label={`${t('year')} *`}
              value={invoicePeriod.year}
              onChange={(e) =>
                setInvoicePeriod({ ...invoicePeriod, year: parseInt(e.target.value) || new Date().getFullYear() })
              }
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

      <DeleteContractDialog
        isOpen={!!deleteConfirm}
        contractId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}

