'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocumentDetail } from '@/components/registratura/DocumentDetail';
import { DocumentWorkflow } from '@/components/registratura/DocumentWorkflow';
import { DocumentAttachments } from '@/components/registratura/DocumentAttachments';
import { useDocument, useUpdateDocument, useDeleteDocument, Document } from '@/hooks/useDocuments';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DocumentForm } from '@/components/registratura/DocumentForm';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';

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
  // Note: This page is for document_registry, not general_register
  // Using document_registry hooks and components
  const { document, fetchDocument, loading: documentLoading } = useDocument(id);
  const { updateDocument } = useUpdateDocument();
  const { deleteDocument } = useDeleteDocument();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchDocument(id);
    }
  }, [permissionLoading, id, fetchDocument]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSave = async (data: any) => {
    if (!document) return;
    const updated = await updateDocument(document.id, data);
    if (updated) {
      setShowEditModal(false);
      if (id) {
        await fetchDocument(id);
      }
      setRefreshKey(k => k + 1);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!document) return;
    
    const success = await deleteDocument(document.id);
    if (success) {
      router.push(`/${locale}/dashboard/registry/registratura/registrul-general`);
    }
    setShowDeleteConfirm(false);
  }, [document, deleteDocument, locale, router]);

  const handleRoute = () => {
    // The DocumentWorkflow component handles routing
    setRefreshKey(k => k + 1);
  };

  const handleResolve = () => {
    // The DocumentWorkflow component handles resolution
    setRefreshKey(k => k + 1);
  };

  const handleWorkflowUpdate = () => {
    if (id) {
      fetchDocument(id);
    }
    setRefreshKey(k => k + 1);
  };

  const handleAttachmentsUpdate = () => {
    setRefreshKey(k => k + 1);
  };

  if (documentLoading) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/registratura/registrul-general` },
          { label: document.formattedNumber || document.subject },
        ]}
        title={document.formattedNumber || document.subject || tReg('document') || 'Document'}
        className="mb-6"
      />

      <DocumentDetail
        document={document}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRoute={handleRoute}
        onResolve={handleResolve}
      />

      <DocumentWorkflow
        key={`workflow-${refreshKey}`}
        documentId={document.id}
        onWorkflowUpdate={handleWorkflowUpdate}
      />

      <DocumentAttachments
        key={`attachments-${refreshKey}`}
        documentId={document.id}
        onAttachmentsUpdate={handleAttachmentsUpdate}
      />

      {showEditModal && document && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={tReg('editDocument')}
          size="full"
        >
          <DocumentForm
            document={document}
            parishId={document.parishId}
            onSave={handleSave}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={tReg('confirmDeleteDocument')}
        message={tReg('confirmDeleteDocument')}
        variant="danger"
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  );
}
