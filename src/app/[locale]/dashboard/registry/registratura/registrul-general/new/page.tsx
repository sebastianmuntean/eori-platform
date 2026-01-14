'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { GeneralRegisterForm } from '@/components/registratura/GeneralRegisterForm';
import { createGeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';

export default function CreateDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');
  const { toasts, success, error: showError, removeToast } = useToast();

  // Get registerId from URL
  const registerIdFromUrl = searchParams.get('registerId');

  // Check permission to view general register
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // All hooks must be called before any conditional returns
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async (data: {
    registerConfigurationId: string;
    documentType: 'incoming' | 'outgoing' | 'internal';
    subject: string;
    from?: string | null;
    to?: string | null;
    description?: string | null;
    filePath?: string | null;
    status?: 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
  }) => {
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/new/page.tsx:44',message:'Creating general register document',data:{registerConfigurationId:data.registerConfigurationId,documentType:data.documentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const document = await createGeneralRegisterDocument(data);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6b2b323b-9151-4a40-9be4-c8a5ddf1ca69',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'registrul-general/new/page.tsx:47',message:'Document created, redirecting',data:{documentId:document?.id,redirectUrl:`/${locale}/dashboard/registry/registratura/registrul-general/${document?.id}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (document) {
        success(tReg('documentCreated'));
        router.push(`/${locale}/dashboard/registry/registratura/registrul-general/${document.id}`);
      } else {
        showError(tReg('errors.failedToCreate') || 'Eroare la crearea documentului');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToCreate') || 'Eroare la crearea documentului';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [locale, router, success, showError, tReg]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/registry/registratura/registrul-general`);
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/registratura/registrul-general` },
          { label: tReg('newDocument') },
        ]}
        title={tReg('newDocument') || 'New Document'}
        description={tReg('newDocumentDescription')}
        className="mb-6"
      />

      <Card>
        <CardBody>
          <GeneralRegisterForm
            onSave={handleSave}
            onCancel={handleCancel}
            loading={loading}
            initialData={registerIdFromUrl ? { registerConfigurationId: registerIdFromUrl } : undefined}
          />
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}
