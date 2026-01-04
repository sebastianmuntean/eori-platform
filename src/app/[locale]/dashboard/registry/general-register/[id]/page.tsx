'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { GeneralRegisterWorkflow } from '@/components/registratura/GeneralRegisterWorkflow';
import { GeneralRegisterAttachments } from '@/components/registratura/GeneralRegisterAttachments';
import { getGeneralRegisterDocument, GeneralRegisterDocument } from '@/hooks/useGeneralRegister';
import { useTranslations } from 'next-intl';

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

      {/* Document Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{document.subject}</h1>
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/${locale}/dashboard/registry/general-register/new?copyFrom=${document.id}`);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {tReg('copyDocument')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Număr Document</label>
            <p className="mt-1">{document.documentNumber}/{document.year}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Tip Document</label>
            <p className="mt-1">{document.documentType}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Data</label>
            <p className="mt-1">{new Date(document.date).toLocaleDateString('ro-RO')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <p className="mt-1">{document.status}</p>
          </div>
          {document.from && (
            <div>
              <label className="text-sm font-medium text-gray-600">De la</label>
              <p className="mt-1">{document.from}</p>
            </div>
          )}
          {document.to && (
            <div>
              <label className="text-sm font-medium text-gray-600">Către</label>
              <p className="mt-1">{document.to}</p>
            </div>
          )}
          {document.description && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Descriere</label>
              <p className="mt-1">{document.description}</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}

