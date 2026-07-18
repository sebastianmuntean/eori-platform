'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
  useGeneralRegisterDocuments,
  useGeneralRegisterWorkflow,
  deleteGeneralRegisterDocument,
  type GeneralRegisterDocument,
  type GeneralRegisterDocumentType,
  type GeneralRegisterDocumentStatus,
} from '@/hooks/useGeneralRegister';
import { useRegisterConfigurations } from '@/hooks/useRegisterConfigurations';
import { Table } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { FilterGrid, FilterSelect, FilterClear } from '@/components/ui/FilterGrid';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { MenuIcon } from '@/components/ui/icons/MenuIcon';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { GeneralRegisterAttachments } from '@/components/registry/GeneralRegisterAttachments';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { getStatusInfo, getDocumentTypeLabel } from '@/lib/registry/status-utils';

interface GeneralRegisterListProps {
  onDocumentClick?: (document: GeneralRegisterDocument) => void;
  onCreateNew?: () => void;
}

export function GeneralRegisterList({ onDocumentClick, onCreateNew }: GeneralRegisterListProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { documents, loading, error, pagination, fetchDocuments } = useGeneralRegisterDocuments();
  const { registerConfigurations, fetchRegisterConfigurations } = useRegisterConfigurations();
  const { cancelDocument } = useGeneralRegisterWorkflow();
  const { toasts, success, error: showError, removeToast } = useToast();

  const registerFromUrl = searchParams.get('registerId');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(registerFromUrl || '');
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<GeneralRegisterDocumentType | ''>('');
  const [status, setStatus] = useState<GeneralRegisterDocumentStatus | ''>('');
  const [year, setYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [attachmentsModalDocumentId, setAttachmentsModalDocumentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch register configurations on mount
  useEffect(() => {
    fetchRegisterConfigurations();
  }, [fetchRegisterConfigurations]);

  // Set initial register if not set and we have configurations
  useEffect(() => {
    if (!selectedRegisterId && registerConfigurations.length > 0) {
      const firstRegister = registerConfigurations[0];
      setSelectedRegisterId(firstRegister.id);
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('registerId', firstRegister.id);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedRegisterId, registerConfigurations, searchParams, router]);

  // Fetch documents when filters change
  useEffect(() => {
    if (!selectedRegisterId) {
      return; // Don't fetch if no register is selected
    }

    const params: any = {
      page: currentPage,
      pageSize: 10,
      registerConfigurationId: selectedRegisterId,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (documentType) params.documentType = documentType;
    if (status) params.status = status;
    if (year) params.year = parseInt(year);

    fetchDocuments(params);
  }, [selectedRegisterId, search, documentType, status, year, sortBy, sortOrder, currentPage, fetchDocuments]);

  const handleRegisterChange = (registerId: string) => {
    setSelectedRegisterId(registerId);
    setCurrentPage(1);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('registerId', registerId);
    router.replace(`?${params.toString()}`);
  };

  const handleSort = (key: keyof GeneralRegisterDocument) => {
    const keyStr = String(key);
    if (sortBy === keyStr) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(keyStr);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDocumentType('');
    setStatus('');
    setYear('');
    setCurrentPage(1);
  };

  const getFetchParams = useCallback(() => ({
    page: currentPage,
    pageSize: 10,
    registerConfigurationId: selectedRegisterId,
    sortBy,
    sortOrder,
    ...(search && { search }),
    ...(documentType && { documentType }),
    ...(status && { status }),
    ...(year && { year: parseInt(year, 10) }),
  }), [currentPage, selectedRegisterId, sortBy, sortOrder, search, documentType, status, year]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return;
    setActionLoading(true);
    try {
      await deleteGeneralRegisterDocument(deleteConfirmId);
      success('Document șters cu succes');
      setDeleteConfirmId(null);
      await fetchDocuments(getFetchParams());
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Eroare la ștergere');
    } finally {
      setActionLoading(false);
    }
  }, [deleteConfirmId, success, showError, fetchDocuments, getFetchParams]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelConfirmId) return;
    setActionLoading(true);
    try {
      const ok = await cancelDocument(cancelConfirmId, { cancelAll: false });
      if (ok) {
        success('Document anulat cu succes');
        setCancelConfirmId(null);
        await fetchDocuments(getFetchParams());
      } else {
        showError('Eroare la anulare');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Eroare la anulare');
    } finally {
      setActionLoading(false);
    }
  }, [cancelConfirmId, cancelDocument, success, showError, fetchDocuments, getFetchParams]);

  const handleCreateNew = () => {
    // Always include registerId in URL when creating new document
    const urlParams = new URLSearchParams();
    if (selectedRegisterId) {
      urlParams.set('registerId', selectedRegisterId);
    }
    const queryString = urlParams.toString();
    const newUrl = `/${locale}/dashboard/registry/general-register/new${queryString ? `?${queryString}` : ''}`;
    
    if (onCreateNew) {
      // If callback is provided, we still need to navigate with registerId
      router.push(newUrl);
    } else {
      router.push(newUrl);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo(status);
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDocumentNumber = (doc: GeneralRegisterDocument) => {
    return `${doc.documentNumber}/${doc.year}`;
  };

  const columns = [
    {
      key: 'documentNumber' as keyof GeneralRegisterDocument,
      label: 'Număr',
      sortable: true,
      render: (_value: any, row: GeneralRegisterDocument) => (
        <span className="font-medium">{formatDocumentNumber(row)}</span>
      ),
    },
    {
      key: 'date' as keyof GeneralRegisterDocument,
      label: 'Data',
      sortable: true,
      render: (value: any) => value ? new Date(value).toLocaleDateString('ro-RO') : '-',
    },
    {
      key: 'documentType' as keyof GeneralRegisterDocument,
      label: 'Tip',
      sortable: true,
      render: (value: any) => getDocumentTypeLabel(value),
    },
    {
      key: 'subject' as keyof GeneralRegisterDocument,
      label: 'Subiect',
      sortable: true,
      render: (value: any) => (
        <span className="max-w-md truncate block" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: 'from' as keyof GeneralRegisterDocument,
      label: 'Expeditor/Destinatar',
      render: (value: any, row: GeneralRegisterDocument) => {
        if (row.documentType === 'incoming') {
          return row.from || '-';
        } else if (row.documentType === 'outgoing') {
          return row.to || '-';
        }
        return '-';
      },
    },
    {
      key: 'status' as keyof GeneralRegisterDocument,
      label: 'Status',
      sortable: true,
      render: (value: any) => getStatusBadge(value),
    },
    {
      key: 'id' as keyof GeneralRegisterDocument,
      label: 'Acțiuni',
      sortable: false,
      render: (_value: any, row: GeneralRegisterDocument) => {
        const canResolve = row.status === 'in_work' || row.status === 'distributed';
        const canCancel = row.status !== 'resolved' && row.status !== 'cancelled';
        const baseUrl = `/${locale}/dashboard/registry/general-register/${row.id}`;
        const items: { label: string; onClick: () => void; variant?: 'default' | 'danger'; icon?: React.ReactNode }[] = [
          { label: 'Deschide', onClick: () => (onDocumentClick ? onDocumentClick(row) : router.push(baseUrl)) },
          { label: 'Workflow', onClick: () => router.push(`${baseUrl}#workflow`) },
          { label: 'Fișiere', onClick: () => setAttachmentsModalDocumentId(row.id) },
          ...(canResolve ? [{ label: 'Solutionare', onClick: () => router.push(baseUrl) }] : []),
          ...(canCancel ? [{ label: 'Anulare', onClick: () => setCancelConfirmId(row.id) }] : []),
          { label: 'Șterge', onClick: () => setDeleteConfirmId(row.id), variant: 'danger' as const },
        ];
        return (
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="p-2 rounded hover:bg-bg-secondary text-text-secondary"
                aria-label="Acțiuni"
              >
                <MenuIcon />
              </button>
            }
            items={items.map(({ label, onClick, variant }) => ({ label, onClick, variant }))}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onCreateNew && (
          <Button onClick={handleCreateNew} variant="primary">
            Document Nou
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Căutare după subiect, număr, expeditor..."
            />
          </div>
        </div>

        <FilterGrid>
          <FilterSelect
            label="Registru *"
            value={selectedRegisterId}
            onChange={handleRegisterChange}
            options={registerConfigurations.map(r => ({
              value: r.id,
              label: `${r.name}${r.parish ? ` (${r.parish.name})` : ''}`
            }))}
            placeholder="Selectează registrul"
          />
          <FilterSelect
            label="Tip Document"
            value={documentType}
            onChange={(value) => setDocumentType(value as GeneralRegisterDocumentType | '')}
            options={[
              { value: 'incoming', label: 'Intrare' },
              { value: 'outgoing', label: 'Ieșire' },
              { value: 'internal', label: 'Intern' },
            ]}
            placeholder="Toate tipurile"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as GeneralRegisterDocumentStatus | '')}
            options={[
              { value: 'draft', label: 'Ciornă' },
              { value: 'in_work', label: 'În lucru' },
              { value: 'distributed', label: 'Repartizat' },
              { value: 'resolved', label: 'Rezolvat' },
              { value: 'cancelled', label: 'Anulat' },
            ]}
            placeholder="Toate statusurile"
          />
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">An</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="An"
              className="w-full px-3 py-2 border rounded bg-bg-primary text-text-primary"
              min="2000"
              max="2100"
            />
          </div>
          <FilterClear onClear={handleClearFilters} />
        </FilterGrid>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger rounded text-danger">
          {error}
        </div>
      )}

      {/* Loading or Empty State */}
      {!selectedRegisterId && (
        <div className="p-4 bg-warning/10 border border-warning rounded text-warning">
          Selectați un registru pentru a afișa documentele.
        </div>
      )}

      {/* Table */}
      {selectedRegisterId && (
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-text-secondary">Se încarcă...</div>
          ) : (
            <Table
              data={documents}
              columns={columns}
              sortConfig={sortBy ? { key: sortBy as keyof GeneralRegisterDocument, direction: sortOrder } : null}
              onSort={handleSort}
              emptyMessage="Nu există documente"
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Afișare {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} din {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
            >
              Următor
            </Button>
          </div>
        </div>
      )}

      <SimpleModal
        isOpen={!!deleteConfirmId}
        onClose={() => !actionLoading && setDeleteConfirmId(null)}
        title="Ștergere document"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)} disabled={actionLoading}>
              Renunță
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={actionLoading}>
              {actionLoading ? 'Se șterge...' : 'Șterge'}
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">Sigur doriți să ștergeți acest document? Acțiunea nu poate fi anulată.</p>
      </SimpleModal>

      <SimpleModal
        isOpen={!!cancelConfirmId}
        onClose={() => !actionLoading && setCancelConfirmId(null)}
        title="Anulare document"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCancelConfirmId(null)} disabled={actionLoading}>
              Renunță
            </Button>
            <Button variant="primary" onClick={handleCancelConfirm} disabled={actionLoading}>
              {actionLoading ? 'Se anulează...' : 'Anulează document'}
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">Sigur doriți să anulați acest document?</p>
      </SimpleModal>

      <SimpleModal
        isOpen={!!attachmentsModalDocumentId}
        onClose={() => setAttachmentsModalDocumentId(null)}
        title="Fișiere atașate"
        size="lg"
      >
        {attachmentsModalDocumentId && (
          <GeneralRegisterAttachments
            documentId={attachmentsModalDocumentId}
            onAttachmentsUpdate={() => {}}
          />
        )}
      </SimpleModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

