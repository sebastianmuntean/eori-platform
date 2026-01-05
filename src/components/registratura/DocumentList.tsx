'use client';

import React, { useState, useEffect } from 'react';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { Table } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { FilterGrid, FilterSelect, FilterClear } from '@/components/ui/FilterGrid';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { SolutionDialog } from './SolutionDialog';
import { CancelDialog } from './CancelDialog';
import { useUser } from '@/hooks/useUser';
import { getStatusInfo, getPriorityInfo, getDocumentTypeLabel, getStatusLabel, getPriorityLabel } from '@/lib/registratura/status-utils';

interface DocumentListProps {
  parishId?: string;
  onDocumentClick?: (document: Document) => void;
  onCreateNew?: () => void;
}

export function DocumentList({ parishId, onDocumentClick, onCreateNew }: DocumentListProps) {
  const router = useRouter();
  const { documents, loading, error, pagination, fetchDocuments } = useDocuments();
  const { user } = useUser();
  
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [solutionDialogOpen, setSolutionDialogOpen] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 10,
      sortBy,
      sortOrder,
    };

    if (parishId) params.parishId = parishId;
    if (search) params.search = search;
    if (documentType) params.documentType = documentType;
    if (status) params.status = status;
    if (year) params.year = parseInt(year);

    fetchDocuments(params);
  }, [parishId, search, documentType, status, year, sortBy, sortOrder, currentPage, fetchDocuments]);

  const handleSort = (key: keyof Document) => {
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

  const handleRowClick = (document: Document) => {
    if (onDocumentClick) {
      onDocumentClick(document);
    } else {
      // Note: This requires locale to be passed as prop or obtained from context
      // For now, rely on onDocumentClick prop
      console.warn('DocumentList: onDocumentClick prop should be provided for navigation');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo(status);
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Check if document can be resolved (simplified - actual check happens server-side)
  const canResolveDocument = (document: Document) => {
    if (!user) return false;
    // Document can be resolved if status is in_work, distributed, or resolved (with at least one rejected branch)
    const actionableStatuses = ['in_work', 'distributed', 'resolved'];
    return actionableStatuses.includes(document.status);
  };

  // Check if document can be cancelled
  const canCancelDocument = (document: Document) => {
    if (!user) return false;
    const isCreator = document.createdBy === user.id;
    // Can cancel if creator or if status allows cancellation
    return isCreator || ['in_work', 'distributed'].includes(document.status);
  };

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = getPriorityInfo(priority);
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  const handlePrintDocument = (document: Document) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Nu se poate deschide fereastra de tipărire. Verifică setările browser-ului pentru popup-uri.');
      return;
    }

    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('ro-RO');
    };

    const printHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document ${document.formattedNumber || document.id}</title>
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
    .section {
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 20px;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1a1a1a;
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 12px;
      color: #1a1a1a;
    }
    .content {
      margin-top: 15px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-draft { background-color: #f3f4f6; color: #374151; }
    .badge-registered { background-color: #dbeafe; color: #1e40af; }
    .badge-in_work { background-color: #fef3c7; color: #92400e; }
    .badge-distributed { background-color: #fef3c7; color: #92400e; }
    .badge-resolved { background-color: #dcfce7; color: #166534; }
    .badge-archived { background-color: #f3f4f6; color: #374151; }
    .badge-cancelled { background-color: #fee2e2; color: #991b1b; }
    .badge-low { background-color: #f3f4f6; color: #374151; }
    .badge-normal { background-color: #dbeafe; color: #1e40af; }
    .badge-high { background-color: #fef3c7; color: #92400e; }
    .badge-urgent { background-color: #fee2e2; color: #991b1b; }
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
    <h1>Document ${document.formattedNumber || 'Fără Număr'}</h1>
    <div class="header-info">
      <div class="header-info-item">
        <span class="header-info-label">Subiect</span>
        <span class="header-info-value">${document.subject || '-'}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">Tip Document</span>
        <span class="header-info-value">${getDocumentTypeLabel(document.documentType)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informații Generale</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Număr Document</span>
        <span class="info-value">${document.formattedNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Data Înregistrării</span>
        <span class="info-value">${formatDate(document.registrationDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-${document.status}">${getStatusLabel(document.status)}</span></span>
      </div>
      <div class="info-item">
        <span class="info-label">Prioritate</span>
        <span class="info-value"><span class="badge badge-${document.priority}">${getPriorityLabel(document.priority)}</span></span>
      </div>
      ${document.externalNumber ? `
      <div class="info-item">
        <span class="info-label">Număr Extern</span>
        <span class="info-value">${document.externalNumber}</span>
      </div>
      ` : ''}
      ${document.externalDate ? `
      <div class="info-item">
        <span class="info-label">Data Externă</span>
        <span class="info-value">${formatDate(document.externalDate)}</span>
      </div>
      ` : ''}
      ${document.dueDate ? `
      <div class="info-item">
        <span class="info-label">Termen Limita</span>
        <span class="info-value">${formatDate(document.dueDate)}</span>
      </div>
      ` : ''}
      ${document.resolvedDate ? `
      <div class="info-item">
        <span class="info-label">Data Rezolvării</span>
        <span class="info-value">${formatDate(document.resolvedDate)}</span>
      </div>
      ` : ''}
      ${document.fileIndex ? `
      <div class="info-item">
        <span class="info-label">Indicativ Arhivare</span>
        <span class="info-value">${document.fileIndex}</span>
      </div>
      ` : ''}
      ${document.isSecret ? `
      <div class="info-item">
        <span class="info-label">Document Secret</span>
        <span class="info-value">Da</span>
      </div>
      ` : ''}
    </div>
  </div>

  ${(document.documentType === 'incoming' && document.senderName) || (document.documentType === 'outgoing' && document.recipientName) ? `
  <div class="section">
    <div class="section-title">${document.documentType === 'incoming' ? 'Expeditor' : 'Destinatar'}</div>
    <div class="info-grid">
      ${document.documentType === 'incoming' && document.senderName ? `
      <div class="info-item">
        <span class="info-label">Nume Expeditor</span>
        <span class="info-value">${document.senderName}</span>
      </div>
      ` : ''}
      ${document.documentType === 'incoming' && document.senderDocNumber ? `
      <div class="info-item">
        <span class="info-label">Nr. Document Expeditor</span>
        <span class="info-value">${document.senderDocNumber}</span>
      </div>
      ` : ''}
      ${document.documentType === 'incoming' && document.senderDocDate ? `
      <div class="info-item">
        <span class="info-label">Data Document Expeditor</span>
        <span class="info-value">${formatDate(document.senderDocDate)}</span>
      </div>
      ` : ''}
      ${document.documentType === 'outgoing' && document.recipientName ? `
      <div class="info-item">
        <span class="info-label">Nume Destinatar</span>
        <span class="info-value">${document.recipientName}</span>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${document.content ? `
  <div class="section">
    <div class="section-title">Conținut</div>
    <div class="content">${document.content}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Metadate</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Creat la</span>
        <span class="info-value">${new Date(document.createdAt).toLocaleString('ro-RO')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Actualizat la</span>
        <span class="info-value">${new Date(document.updatedAt).toLocaleString('ro-RO')}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const columns = [
    {
      key: 'formattedNumber' as keyof Document,
      label: 'Număr',
      sortable: true,
      render: (value: any, row: Document) => (
        <span className="font-medium">{value || '-'}</span>
      ),
    },
    {
      key: 'registrationDate' as keyof Document,
      label: 'Data',
      sortable: true,
      render: (value: any) => value ? new Date(value).toLocaleDateString('ro-RO') : '-',
    },
    {
      key: 'documentType' as keyof Document,
      label: 'Tip',
      sortable: true,
      render: (value: any) => getDocumentTypeLabel(value),
    },
    {
      key: 'subject' as keyof Document,
      label: 'Subiect',
      sortable: true,
      render: (value: any) => (
        <span className="max-w-md truncate block" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: 'senderName' as keyof Document,
      label: 'Expeditor/Destinatar',
      render: (value: any, row: Document) => {
        if (row.documentType === 'incoming') {
          return row.senderName || '-';
        } else if (row.documentType === 'outgoing') {
          return row.recipientName || '-';
        }
        return '-';
      },
    },
    {
      key: 'priority' as keyof Document,
      label: 'Prioritate',
      sortable: true,
      render: (value: any) => getPriorityBadge(value),
    },
    {
      key: 'status' as keyof Document,
      label: 'Status',
      sortable: true,
      render: (value: any) => getStatusBadge(value),
    },
    {
      key: 'actions' as keyof Document,
      label: 'Acțiuni',
      sortable: false,
      render: (_value: any, row: Document) => {
        const canResolve = canResolveDocument(row);
        const canCancel = canCancelDocument(row);

        return (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintDocument(row)}
              title="Tipărire"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </Button>
            {canResolve && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSolutionDialogOpen(row.id)}
                title="Solutionare"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelDialogOpen(row.id)}
                title="Anulare"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Registrul General</h2>
        {onCreateNew && (
          <Button onClick={onCreateNew} variant="primary">
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
              { value: 'registered', label: 'Înregistrat' },
              { value: 'in_work', label: 'În lucru' },
              { value: 'distributed', label: 'Repartizat' },
              { value: 'resolved', label: 'Rezolvat' },
              { value: 'archived', label: 'Arhivat' },
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={documents}
          columns={columns}
          sortConfig={sortBy ? { key: sortBy as keyof Document, direction: sortOrder } : null}
          onSort={handleSort}
          emptyMessage="Nu există documente"
        />
      </div>

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

      {/* Solution Dialog */}
      {solutionDialogOpen && user && (
        <SolutionDialog
          isOpen={!!solutionDialogOpen}
          onClose={() => setSolutionDialogOpen(null)}
          documentId={solutionDialogOpen}
          documentCreatedBy={documents.find(d => d.id === solutionDialogOpen)?.createdBy || ''}
          currentUserId={user.id}
          onSuccess={() => {
            fetchDocuments({
              page: currentPage,
              limit: 10,
              sortBy,
              sortOrder,
            });
          }}
        />
      )}

      {/* Cancel Dialog */}
      {cancelDialogOpen && user && (
        <CancelDialog
          isOpen={!!cancelDialogOpen}
          onClose={() => setCancelDialogOpen(null)}
          documentId={cancelDialogOpen}
          isCreator={documents.find(d => d.id === cancelDialogOpen)?.createdBy === user.id}
          onSuccess={() => {
            fetchDocuments({
              page: currentPage,
              limit: 10,
              sortBy,
              sortOrder,
            });
          }}
        />
      )}
    </div>
  );
}

