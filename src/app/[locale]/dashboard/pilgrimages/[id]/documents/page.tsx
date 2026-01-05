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
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageDocuments, PilgrimageDocument, DocumentType } from '@/hooks/usePilgrimageDocuments';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimageDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('documents') || 'Documents'} - ${pilgrimage.title}` : (tPilgrimages('documents') || 'Documents'));
  const {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
  } = usePilgrimageDocuments();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    documentType: 'information' as DocumentType,
    title: '',
    isPublic: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
      fetchDocuments(id);
    }
  }, [id, fetchPilgrimage, fetchDocuments]);

  const handleUpload = async () => {
    if (!selectedFile || !uploadFormData.title) {
      alert(t('fillRequiredFields'));
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDocument(id, selectedFile, {
        documentType: uploadFormData.documentType,
        title: uploadFormData.title,
        isPublic: uploadFormData.isPublic,
      });

      if (result) {
        setShowUploadModal(false);
        resetUploadForm();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    const result = await deleteDocument(id, documentId);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleDownload = async (documentId: string) => {
    await downloadDocument(id, documentId);
  };

  const resetUploadForm = () => {
    setUploadFormData({
      documentType: 'information',
      title: '',
      isPublic: false,
    });
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    return tPilgrimages(`documentTypes.${type}` as any) || type;
  };

  const columns = [
    {
      key: 'title',
      label: tPilgrimages('titleField'),
      sortable: true,
    },
    {
      key: 'documentType',
      label: tPilgrimages('documentType'),
      sortable: false,
      render: (value: DocumentType) => (
        <Badge variant="secondary" size="sm">
          {getDocumentTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'fileName',
      label: tPilgrimages('document'),
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: t('size'),
      sortable: false,
      render: (value: number | null) => formatFileSize(value),
    },
    {
      key: 'isPublic',
      label: tPilgrimages('isPublic'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('yes') : t('no')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: t('createdAt'),
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: any, row: PilgrimageDocument) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: tPilgrimages('downloadDocument'), onClick: () => handleDownload(row.id) },
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('documents') },
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{tPilgrimages('documents')}</h1>
        <Button onClick={() => setShowUploadModal(true)}>
          {tPilgrimages('uploadDocument')}
        </Button>
      </div>

      {/* Documents Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">{t('loading') || 'Loading...'}</div>
          ) : (
            <Table
              data={documents}
              columns={columns}
            />
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          resetUploadForm();
        }}
        title={tPilgrimages('uploadDocument')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('documentType')} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={uploadFormData.documentType}
              onChange={(e) => setUploadFormData({ ...uploadFormData, documentType: e.target.value as DocumentType })}
              required
            >
              <option value="program">{tPilgrimages('documentTypes.program')}</option>
              <option value="information">{tPilgrimages('documentTypes.information')}</option>
              <option value="contract">{tPilgrimages('documentTypes.contract')}</option>
              <option value="insurance">{tPilgrimages('documentTypes.insurance')}</option>
              <option value="visa_info">{tPilgrimages('documentTypes.visa_info')}</option>
              <option value="other">{tPilgrimages('documentTypes.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('titleField')} *</label>
            <Input
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('file')}</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={uploadFormData.isPublic}
              onChange={(e) => setUploadFormData({ ...uploadFormData, isPublic: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              {tPilgrimages('isPublic')}
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                resetUploadForm();
              }}
              disabled={uploading}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile || !uploadFormData.title}>
              {uploading ? (t('uploading') || 'Uploading...') : t('upload') || 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p>{tPilgrimages('confirmDeleteDocument') || 'Are you sure you want to delete this document?'}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={loading}
            >
              {loading ? (t('deleting') || 'Deleting...') : t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
