'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { GeneralRegisterForm } from '@/components/registratura/GeneralRegisterForm';
import { createGeneralRegisterDocument, getGeneralRegisterDocument, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
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

  // Check permission to view general register
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // All hooks must be called before any conditional returns
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<{
    registerConfigurationId?: string;
    documentType?: 'incoming' | 'outgoing' | 'internal';
    subject?: string;
    from?: string | null;
    petitionerClientId?: string | null;
    to?: string | null;
    description?: string | null;
    status?: 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
  } | undefined>(undefined);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const { toasts, success, error: showError, removeToast } = useToast();

  // Handle copyFrom query parameter
  useEffect(() => {
    if (permissionLoading) return;
    const copyFromId = searchParams.get('copyFrom');
    if (copyFromId) {
      setLoadingCopy(true);
      getGeneralRegisterDocument(copyFromId)
        .then((doc: GeneralRegisterDocument | null) => {
          if (doc) {
            // Get petitionerClientId from document
            const petitionerClientId = doc.petitionerClientId || null;
            setInitialData({
              registerConfigurationId: doc.registerConfigurationId,
              documentType: doc.documentType,
              subject: doc.subject,
              from: doc.from,
              petitionerClientId: petitionerClientId,
              to: doc.to,
              description: doc.description,
              status: 'draft', // Always set to draft when copying
            });
          }
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : tReg('errors.failedToCreate') || 'Eroare la încărcarea documentului';
          showError(errorMessage);
        })
        .finally(() => {
          setLoadingCopy(false);
        });
    }
  }, [permissionLoading, searchParams, showError, tReg]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

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
      const document = await createGeneralRegisterDocument(data);
      
      if (document) {
        success(tReg('documentCreated'));
        router.push(`/${locale}/dashboard/registry/general-register/${document.id}`);
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

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/registry/general-register`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
          { label: tReg('newDocument') },
        ]}
        title={initialData ? tReg('copyDocument') : tReg('newDocument')}
        description={initialData ? tReg('copyDocumentDescription') : tReg('newDocumentDescription')}
        className="mb-6"
      />

      <Card>
        <CardBody>
          {loadingCopy ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">{tReg('loading')}</div>
            </div>
          ) : (
            <GeneralRegisterForm
              onSave={handleSave}
              onCancel={handleCancel}
              loading={loading}
              initialData={initialData}
            />
          )}
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

