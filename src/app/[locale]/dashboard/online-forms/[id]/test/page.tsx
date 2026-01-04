'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { WidgetForm } from '@/components/online-forms/WidgetForm';
import { useOnlineForm } from '@/hooks/useOnlineForms';
import { useTranslations } from 'next-intl';

export default function TestFormPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  const { form, fetchForm } = useOnlineForm();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchForm(id);
    }
  }, [id, fetchForm]);

  const handleSubmitSuccess = (submissionId: string) => {
    setSubmissionId(submissionId);
    setSubmissionStatus('success');
  };

  const handleSubmitError = (error: string) => {
    setSubmissionStatus(`error: ${error}`);
  };

  if (!form) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
          { label: form.name, href: `/${locale}/dashboard/online-forms/${id}` },
          { label: tForms('testForm') },
        ]}
      />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{tForms('testForm')}</h1>
          <p className="text-sm text-text-secondary">{tForms('testFormDescription')}</p>
        </CardHeader>
        <CardBody>
          <div className="mb-4 p-4 bg-bg-secondary rounded">
            <h3 className="font-semibold mb-2">Widget Code:</h3>
            <code className="text-sm bg-bg-primary px-2 py-1 rounded">{form.widgetCode}</code>
            <p className="text-xs text-text-secondary mt-2">
              Use this code to embed the form on external websites
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4">Form Preview:</h3>
            <WidgetForm
              widgetCode={form.widgetCode}
              onSubmitSuccess={handleSubmitSuccess}
              onSubmitError={handleSubmitError}
            />
          </div>

          {submissionId && (
            <div className="mt-6 p-4 bg-success/10 border border-success rounded">
              <h4 className="font-semibold text-success mb-2">Submission Successful!</h4>
              <p className="text-sm">
                <strong>Submission ID:</strong> {submissionId}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {submissionStatus}
              </p>
            </div>
          )}

          {submissionStatus.startsWith('error') && (
            <div className="mt-6 p-4 bg-danger/10 border border-danger rounded">
              <h4 className="font-semibold text-danger mb-2">Error</h4>
              <p className="text-sm">{submissionStatus}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}


