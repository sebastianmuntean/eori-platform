'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GeneralRegisterWorkflow } from '@/components/registratura/GeneralRegisterWorkflow';
import { GeneralRegisterAttachments } from '@/components/registratura/GeneralRegisterAttachments';
import { GeneralRegisterEditForm } from '@/components/registratura/GeneralRegisterEditForm';
import { getGeneralRegisterDocument, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');
  const id = params.id as string;

  // Check permission to view general register
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // All hooks must be called before any conditional returns
  const [document, setDocument] = useState<GeneralRegisterDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toasts, success, error: showError, removeToast } = useToast();

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      console.log('[FIXED] Fetching general register document with ID:', id);
      console.log('[FIXED] Using getGeneralRegisterDocument - should call /api/registratura/general-register/' + id);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/[id]/page.tsx:38',message:'Fetching general register document',data:{documentId:id,apiEndpoint:'/api/registratura/general-register/'+id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const doc = await getGeneralRegisterDocument(id);
      console.log('[FIXED] Document fetched:', doc ? 'SUCCESS' : 'NULL');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/[id]/page.tsx:42',message:'Document fetched successfully',data:{documentId:id,found:!!doc},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setDocument(doc);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/[id]/page.tsx:46',message:'Error fetching document',data:{documentId:id,error:err instanceof Error ? err.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Error is handled by the component state (document will be null)
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchDocument();
  }, [permissionLoading, fetchDocument]);

  const handleDelete = useCallback(async () => {
    if (!document) return;
    
    try {
      // Note: DELETE endpoint may not be implemented yet
      showError(tReg('errors.deleteNotSupported') || 'Ștergerea documentelor nu este disponibilă momentan');
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting document:', err);
      setShowDeleteConfirm(false);
    }
  }, [document, showError, tReg]);

  const handleSave = useCallback(async (data: {
    subject: string;
    description?: string | null;
    solutionStatus: 'approved' | 'rejected' | 'redirected' | null;
    distributedUserIds: string[];
    dueDate?: string | null;
    notes?: string | null;
  }) => {
    if (!document) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/registratura/general-register/${document.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        success(tReg('documentUpdated') || 'Document actualizat cu succes');
        setShowEditModal(false);
        await fetchDocument();
        setRefreshKey(k => k + 1);
      } else {
        showError(result.error || tReg('errors.failedToUpdate') || 'Eroare la actualizarea documentului');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToUpdate') || 'Eroare la actualizarea documentului';
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [document, fetchDocument, success, showError, tReg]);

  const handleWorkflowUpdate = useCallback(() => {
    fetchDocument();
    setRefreshKey(k => k + 1);
  }, [fetchDocument]);

  const handleAttachmentsUpdate = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleEdit = () => {
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">{tReg('loading')}</div>
      </div>
    );
  }

  if (!document) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/[id]/page.tsx:107',message:'Document not found - showing error',data:{documentId:id,loading},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
            { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/registratura/registrul-general` },
            { label: tReg('document') },
          ]}
          title={tReg('document') || 'Document'}
          className="mb-6"
        />
        <div className="text-center py-12">
          <p className="text-text-secondary">{tReg('documentNotFound')}</p>
        </div>
      </div>
    );
  }

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      incoming: 'Intrare',
      outgoing: 'Ieșire',
      internal: 'Intern',
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Ciornă',
      in_work: 'În lucru',
      distributed: 'Distribuit',
      resolved: 'Rezolvat',
      cancelled: 'Anulat',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: string): 'secondary' | 'success' | 'warning' | 'danger' => {
    const variantMap: Record<string, 'secondary' | 'success' | 'warning' | 'danger'> = {
      draft: 'secondary',
      in_work: 'warning',
      distributed: 'warning',
      resolved: 'success',
      cancelled: 'danger',
    };
    return variantMap[status] || 'secondary';
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/registratura/registrul-general` },
          { label: `${document.documentNumber}/${document.year} - ${document.subject}` },
        ]}
        title={`${document.documentNumber}/${document.year} - ${document.subject}`}
        className="mb-6"
      />

      {/* Document Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Detalii Document</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleEdit}>
                {tReg('editDocument') || 'Editează'}
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                {t('delete')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary">Număr Document</label>
              <p className="mt-1">{document.documentNumber}/{document.year}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Tip Document</label>
              <p className="mt-1">{getDocumentTypeLabel(document.documentType)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(document.status)}>
                  {getStatusLabel(document.status)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Data</label>
              <p className="mt-1">{new Date(document.date).toLocaleDateString('ro-RO')}</p>
            </div>
            {document.from && (
              <div>
                <label className="text-sm font-medium text-text-secondary">De la</label>
                <p className="mt-1">{document.from}</p>
              </div>
            )}
            {document.to && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Către</label>
                <p className="mt-1">{document.to}</p>
              </div>
            )}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-text-secondary">Subiect</label>
              <p className="mt-1">{document.subject}</p>
            </div>
            {document.description && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium text-text-secondary">Descriere</label>
                <p className="mt-1">{document.description}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <GeneralRegisterWorkflow
        key={`workflow-${refreshKey}`}
        documentId={document.id}
        onWorkflowUpdate={handleWorkflowUpdate}
      />

      <GeneralRegisterAttachments
        key={`attachments-${refreshKey}`}
        documentId={document.id}
        onAttachmentsUpdate={handleAttachmentsUpdate}
      />

      {showEditModal && document && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={tReg('editDocument') || 'Editează Document'}
          size="full"
        >
          <GeneralRegisterEditForm
            onSave={handleSave}
            onCancel={() => setShowEditModal(false)}
            loading={saving}
            initialData={{
              subject: document.subject,
              description: document.description,
              dueDate: (document as any).dueDate || null,
              notes: (document as any).notes || null,
            }}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={tReg('confirmDeleteDocument') || 'Confirmă ștergerea'}
        message={tReg('confirmDeleteDocument') || 'Sigur doriți să ștergeți acest document?'}
        variant="danger"
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}
