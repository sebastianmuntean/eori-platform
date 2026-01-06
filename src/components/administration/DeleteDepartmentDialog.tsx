'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteDepartmentDialogProps {
  isOpen: boolean;
  departmentId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a department
 * Provides a consistent confirmation UI for this action
 */
export function DeleteDepartmentDialog({
  isOpen,
  departmentId,
  onClose,
  onConfirm,
}: DeleteDepartmentDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (departmentId) {
      onConfirm(departmentId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!departmentId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteDepartment') || t('confirmDelete')}
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
    />
  );
}

