'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteEmailTemplateDialogProps {
  isOpen: boolean;
  templateId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting an email template
 * Provides a consistent confirmation UI for this action
 */
export function DeleteEmailTemplateDialog({
  isOpen,
  templateId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteEmailTemplateDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (templateId) {
      onConfirm(templateId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!templateId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteTemplate') || t('confirmDelete')}
      confirmLabel={t('deleteTemplate') || t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

