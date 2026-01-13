'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useGeneralRegisterDocuments, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useRegisterConfigurations } from '@/hooks/useRegisterConfigurations';
import { Table } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { FilterGrid, FilterSelect, FilterClear } from '@/components/ui/FilterGrid';
import { Badge } from '@/components/ui/Badge';
import { getStatusInfo, getPriorityInfo, getDocumentTypeLabel, getStatusLabel } from '@/lib/registratura/status-utils';

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
  
  // Get register from URL or use first available
  const registerFromUrl = searchParams.get('registerId');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(registerFromUrl || '');
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

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


  const handleCreateNew = () => {
    // Always include registerId in URL when creating new document
    const urlParams = new URLSearchParams();
    if (selectedRegisterId) {
      urlParams.set('registerId', selectedRegisterId);
    }
    const queryString = urlParams.toString();
    const newUrl = `/${locale}/dashboard/registry/registratura/registrul-general/new${queryString ? `?${queryString}` : ''}`;
    
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
            onChange={setDocumentType}
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
            onChange={setStatus}
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
    </div>
  );
}

