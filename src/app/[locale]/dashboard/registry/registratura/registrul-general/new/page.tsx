'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { GeneralRegisterForm } from '@/components/registratura/GeneralRegisterForm';
import { createGeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';

export default function CreateDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');
  const { toasts, success, error: showError, removeToast } = useToast();

  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async (data: {
    registerConfigurationId: string;
    documentType: 'incoming' | 'outgoing' | 'internal';
    subject: string;
    from?: string | null;
    to?: string | null;
    description?: string | null;
    filePath?: string | null;
    status?: 'draft' | 'registered' | 'in_work' | 'distributed' | 'resolved' | 'archived' | 'cancelled';
  }) => {
    setLoading(true);
    try {
      const document = await createGeneralRegisterDocument(data);
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

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/registry/registratura/registrul-general`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/registratura/registrul-general` },
          { label: tReg('newDocument'), href: '#' },
        ]}
      />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{tReg('newDocument')}</h1>
          <p className="text-gray-600">
            {tReg('newDocumentDescription')}
          </p>
        </CardHeader>
        <CardBody>
          <GeneralRegisterForm
            onSave={handleSave}
            onCancel={handleCancel}
            loading={loading}
          />
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
