'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { GeneralRegisterWorkflow } from '@/components/registratura/GeneralRegisterWorkflow';
import { GeneralRegisterAttachments } from '@/components/registratura/GeneralRegisterAttachments';
import { GeneralRegisterEditForm } from '@/components/registratura/GeneralRegisterEditForm';
import { getGeneralRegisterDocument, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');
  const id = params.id as string;

  const [document, setDocument] = useState<GeneralRegisterDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
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
    fetchDocument();
  }, [fetchDocument]);

  const handleWorkflowUpdate = useCallback(() => {
    fetchDocument();
    setRefreshKey(k => k + 1);
  }, [fetchDocument]);

  const handleAttachmentsUpdate = () => {
    setRefreshKey(k => k + 1);
  };

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
      // TODO: Implement API endpoint for updating document
      // For now, just show success and redirect to list
      success(tReg('documentUpdated') || 'Document actualizat cu succes');
      // Redirect to list page after successful save
      router.push(`/${locale}/dashboard/registry/general-register`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToUpdate') || 'Eroare la actualizarea documentului';
      showError(errorMessage);
      setSaving(false);
    }
  }, [document, router, locale, success, showError, tReg]);

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
        <Breadcrumbs
          items={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
            { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
            { label: tReg('document'), href: '#' },
          ]}
        />
        <div className="text-center py-12">
          <p className="text-text-secondary">{tReg('documentNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
          { label: document.subject, href: '#' },
        ]}
      />

      {/* Edit Form - Screen 2 */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Editare Document</h2>
        </CardHeader>
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
            <div className="border-t border-border pt-6">
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

      <GeneralRegisterWorkflow
        key={`workflow-${refreshKey}`}
        documentId={document.id}
        onWorkflowUpdate={handleWorkflowUpdate}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
