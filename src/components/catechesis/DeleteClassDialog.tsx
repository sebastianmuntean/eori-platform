'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteClassDialogProps {
  isOpen: boolean;
  classId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isSubmitting?: boolean;
}

/**
 * Confirmation dialog for deleting a catechesis class
 * Provides a consistent confirmation UI for this action
 */
export function DeleteClassDialog({
  isOpen,
  classId,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DeleteClassDialogProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  const handleConfirm = () => {
    if (classId) {
      onConfirm(classId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!classId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirm')}
      message={tCatechesis('classes.confirmDelete') || t('confirmDelete') || 'Are you sure you want to delete this class?'}
      confirmLabel={isSubmitting ? t('deleting') || 'Deleting...' : t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
      isLoading={isSubmitting}
    />
  );
}

