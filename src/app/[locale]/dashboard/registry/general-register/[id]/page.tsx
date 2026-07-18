'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { GeneralRegisterWorkflow } from '@/components/registry/GeneralRegisterWorkflow';
import { GeneralRegisterAttachments } from '@/components/registry/GeneralRegisterAttachments';
import { GeneralRegisterEditForm } from '@/components/registry/GeneralRegisterEditForm';
import { SolutionDialog } from '@/components/registry/SolutionDialog';
import { getGeneralRegisterDocument, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useGeneralRegisterWorkflow } from '@/hooks/useGeneralRegister';
import { useUser } from '@/hooks/useUser';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registry');
  const id = params.id as string;

  // Check permission to view general register
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // All hooks must be called before any conditional returns
  const [document, setDocument] = useState<GeneralRegisterDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [solutionDialogOpen, setSolutionDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { user } = useUser();
  const { cancelDocument } = useGeneralRegisterWorkflow();
  const { toasts, success, error: showError, removeToast } = useToast();

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const doc = await getGeneralRegisterDocument(id);
      setDocument(doc);
    } catch (err) {
      // Error is handled by the component state (document will be null)
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchDocument();
  }, [permissionLoading, fetchDocument]);

  const handleWorkflowUpdate = useCallback(() => {
    fetchDocument();
    setRefreshKey(k => k + 1);
  }, [fetchDocument]);

  const handleAttachmentsUpdate = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

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
      const response = await fetch(`/api/registry/general-register/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: data.subject,
          description: data.description,
          solutionStatus: data.solutionStatus,
          distributedUserIds: data.distributedUserIds,
          dueDate: data.dueDate,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update document');
      }

      success(tReg('documentUpdated') || 'Document actualizat cu succes');
      // Refresh document data
      await fetchDocument();
      setRefreshKey(k => k + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToUpdate') || 'Eroare la actualizarea documentului';
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [document, fetchDocument, success, showError, tReg]);

  const handleSolutionSuccess = useCallback(() => {
    fetchDocument();
    setRefreshKey(k => k + 1);
  }, [fetchDocument]);

  const handleCancel = useCallback(async () => {
    if (!document || !window.confirm(tReg('confirmCancelDocument') || 'Sigur doriți să anulați acest document?')) return;
    setCancelling(true);
    try {
      const ok = await cancelDocument(document.id, { cancelAll: false });
      if (ok) {
        success(tReg('documentCancelled') || 'Document anulat cu succes');
        await fetchDocument();
        setRefreshKey(k => k + 1);
      } else {
        showError(tReg('errors.failedToCancel') || 'Eroare la anulare');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : tReg('errors.failedToCancel') || 'Eroare la anulare');
    } finally {
      setCancelling(false);
    }
  }, [document, cancelDocument, fetchDocument, success, showError, tReg]);

  const canResolve = document?.status === 'in_work' || document?.status === 'distributed';
  const canCancel = document?.status !== 'resolved' && document?.status !== 'cancelled';

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">{tReg('loading')}</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tReg('registry'), href: `/${locale}/dashboard/registry` },
            { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
            { label: tReg('document') },
          ]}
          title={tReg('document')}
          className="mb-6"
        />
        <div className="text-center py-12">
          <p className="text-text-secondary">{tReg('documentNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registry'), href: `/${locale}/dashboard/registry` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
          { label: document.subject },
        ]}
        title="Editare Document"
        className="mb-6"
        action={
          document ? (
            <div className="flex gap-2">
              {canResolve && (
                <Button variant="primary" onClick={() => setSolutionDialogOpen(true)}>
                  Solutionare
                </Button>
              )}
              {canCancel && (
                <Button variant="warning" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Se anulează...' : 'Anulare'}
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {/* Edit Form - Screen 2 */}
      <Card>
        <CardBody>
          <div className="space-y-6">
            <GeneralRegisterEditForm
              onSave={handleSave}
              onCancel={() => {
                fetchDocument();
              }}
              loading={saving}
              initialData={{
                subject: document.subject,
                description: document.description,
                dueDate: (document as any).dueDate || null,
                notes: (document as any).notes || null,
              }}
            />
            
            {/* Attachments Section */}
            <div id="attachments" className="border-t border-border pt-6 scroll-mt-4">
              <h3 className="text-lg font-semibold mb-4">Atașamente</h3>
              <GeneralRegisterAttachments
                key={`attachments-${refreshKey}`}
                documentId={document.id}
                onAttachmentsUpdate={handleAttachmentsUpdate}
              />
            </div>
          </div>
        </CardBody>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => fetchDocument()} 
            disabled={saving}
          >
            Renunță
          </Button>
          <Button 
            type="button"
            onClick={() => {
              const form = window.document.querySelector('form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={saving}
          >
            {saving ? 'Salvează...' : 'Salvează'}
          </Button>
        </div>
      </Card>

      <div id="workflow" className="scroll-mt-4">
        <GeneralRegisterWorkflow
          key={`workflow-${refreshKey}`}
          documentId={document.id}
          onWorkflowUpdate={handleWorkflowUpdate}
        />
      </div>

      {user && document && (
        <SolutionDialog
          isOpen={solutionDialogOpen}
          onClose={() => setSolutionDialogOpen(false)}
          documentId={document.id}
          documentCreatedBy={document.createdBy}
          currentUserId={user.id}
          onSuccess={handleSolutionSuccess}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}
