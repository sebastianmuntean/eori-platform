'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteCemeteryDialogProps {
  isOpen: boolean;
  cemeteryId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a cemetery
 * Provides a consistent confirmation UI for this action
 */
export function DeleteCemeteryDialog({
  isOpen,
  cemeteryId,
  onClose,
  onConfirm,
}: DeleteCemeteryDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (cemeteryId) {
      onConfirm(cemeteryId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!cemeteryId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteCemetery') || 'Are you sure you want to delete this cemetery?'}
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
    />
  );
}

