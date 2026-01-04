'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useEmailSubmissions, EmailSubmission, EmailSubmissionStatus } from '@/hooks/useEmailSubmissions';
import { useTranslations } from 'next-intl';

export default function EmailFetcherPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    submissions,
    loading,
    error,
    pagination,
    fetchSubmissions,
    processSubmission,
    triggerEmailFetcher,
  } = useEmailSubmissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailSubmissionStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<EmailSubmission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    };
    fetchSubmissions(params);
  }, [currentPage, searchTerm, statusFilter, fetchSubmissions]);

  const handleTriggerFetcher = async () => {
    setIsTriggering(true);
    try {
      const result = await triggerEmailFetcher();
      if (result) {
        alert(`Email fetcher executat cu succes!\nProcesate: ${result.processed}\nCreate: ${result.created}\nErori: ${result.errors}`);
      }
    } catch (err) {
      alert('Eroare la declanșarea email fetcher-ului');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleProcessSubmission = async (id: string) => {
    if (!confirm('Sigur doriți să procesați acest email?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processSubmission(id);
      if (result) {
        alert('Email procesat cu succes! Eveniment creat.');
      }
    } catch (err) {
      alert('Eroare la procesarea email-ului');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (submission: EmailSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };

  const getStatusBadgeVariant = (status: EmailSubmissionStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processed':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: EmailSubmissionStatus) => {
    switch (status) {
      case 'pending':
        return 'În așteptare';
      case 'processed':
        return 'Procesat';
      case 'error':
        return 'Eroare';
      default:
        return status;
    }
  };

  // Calculate statistics
  const stats = {
    pending: submissions.filter((s) => s.status === 'pending').length,
    processed: submissions.filter((s) => s.status === 'processed').length,
    errors: submissions.filter((s) => s.status === 'error').length,
    total: submissions.length,
  };

  const columns = [
    {
      key: 'fromEmail',
      label: 'De la',
      sortable: false,
      render: (value: string) => (
        <div className="font-medium text-text-primary">{value}</div>
      ),
    },
    {
      key: 'subject',
      label: 'Subiect',
      sortable: false,
      render: (value: string | null) => (
        <div className="text-text-secondary">
          {value || <span className="italic">(fără subiect)</span>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value: EmailSubmissionStatus) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Data primire',
      sortable: false,
      render: (value: string | Date) => (
        <div className="text-text-secondary">
          {new Date(value).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      key: 'id' as keyof EmailSubmission,
      label: 'Acțiuni',
      sortable: false,
      render: (_: any, row: EmailSubmission) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            Detalii
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleProcessSubmission(row.id)}
              disabled={isProcessing}
            >
              Procesează
            </Button>
          )}
        </div>
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('dashboard'), href: `/${locale}/dashboard` },
    { label: t('events') || 'Evenimente', href: `/${locale}/dashboard/events` },
    { label: 'Email Fetcher' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">Gestionare Email Fetcher</h1>
        </div>
        <Button
          onClick={handleTriggerFetcher}
          disabled={isTriggering || loading}
        >
          {isTriggering ? 'Se procesează...' : 'Declanșează verificarea email-urilor'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card variant="elevated">
          <CardBody>
            <div className="text-sm text-text-secondary">Total email-uri</div>
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div className="text-sm text-text-secondary">În așteptare</div>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div className="text-sm text-text-secondary">Procesate</div>
            <div className="text-2xl font-bold text-success">{stats.processed}</div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div className="text-sm text-text-secondary">Erori</div>
            <div className="text-2xl font-bold text-danger">{stats.errors}</div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Caută după email, subiect sau conținut..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EmailSubmissionStatus | '')}
            >
              <option value="">Toate statusurile</option>
              <option value="pending">În așteptare</option>
              <option value="processed">Procesat</option>
              <option value="error">Eroare</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="outlined" className="mb-6 border-danger">
          <CardBody>
            <div className="text-danger">{error}</div>
          </CardBody>
        </Card>
      )}

      {/* Submissions Table */}
      <Card variant="outlined">
        <CardHeader>
          <h2 className="text-xl font-semibold text-text-primary">Email-uri primite</h2>
        </CardHeader>
        <CardBody>
          {loading && submissions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">Se încarcă...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">Nu există email-uri</div>
          ) : (
            <>
              <Table columns={columns} data={submissions} />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-secondary">
                    Pagina {pagination.page} din {pagination.totalPages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages || loading}
                    >
                      Următor
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Details Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSubmission(null);
          }}
          title="Detalii email"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                De la
              </label>
              <div className="text-text-primary">{selectedSubmission.fromEmail}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Subiect
              </label>
              <div className="text-text-primary">
                {selectedSubmission.subject || <span className="italic">(fără subiect)</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Status
              </label>
              <Badge variant={getStatusBadgeVariant(selectedSubmission.status)}>
                {getStatusLabel(selectedSubmission.status)}
              </Badge>
            </div>

            {selectedSubmission.errorMessage && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Mesaj eroare
                </label>
                <div className="text-danger bg-danger/10 p-3 rounded">{selectedSubmission.errorMessage}</div>
              </div>
            )}

            {selectedSubmission.eventId && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Eveniment creat
                </label>
                <div className="text-text-primary">
                  <a
                    href={`/${locale}/dashboard/events`}
                    className="text-primary hover:underline"
                  >
                    Vezi eveniment #{selectedSubmission.eventId.substring(0, 8)}...
                  </a>
                </div>
              </div>
            )}

            {selectedSubmission.processedAt && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Procesat la
                </label>
                <div className="text-text-primary">
                  {new Date(selectedSubmission.processedAt).toLocaleString('ro-RO')}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Primit la
              </label>
              <div className="text-text-primary">
                {new Date(selectedSubmission.createdAt).toLocaleString('ro-RO')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Conținut
              </label>
              <div className="bg-bg-secondary p-4 rounded-md max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono">
                  {selectedSubmission.content}
                </pre>
              </div>
            </div>

            {selectedSubmission.status === 'pending' && (
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSubmission(null);
                  }}
                >
                  Închide
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleProcessSubmission(selectedSubmission.id);
                  }}
                  disabled={isProcessing}
                >
                  Procesează email-ul
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

