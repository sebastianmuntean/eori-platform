'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteStudentDialogProps {
  isOpen: boolean;
  studentId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isSubmitting?: boolean;
}

/**
 * Confirmation dialog for deleting a catechesis student
 * Provides a consistent confirmation UI for this action
 */
export function DeleteStudentDialog({
  isOpen,
  studentId,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DeleteStudentDialogProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  const handleConfirm = () => {
    if (studentId) {
      onConfirm(studentId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!studentId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirm') || 'Confirm Delete'}
      message={tCatechesis('students.confirmDelete') || t('confirmDelete') || 'Are you sure you want to delete this student?'}
      confirmLabel={isSubmitting ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
      isLoading={isSubmitting}
    />
  );
}

