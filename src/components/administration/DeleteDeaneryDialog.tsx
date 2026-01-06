'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteDeaneryDialogProps {
  isOpen: boolean;
  deaneryId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a deanery
 * Provides a consistent confirmation UI for this action
 */
export function DeleteDeaneryDialog({
  isOpen,
  deaneryId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteDeaneryDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (deaneryId) {
      onConfirm(deaneryId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!deaneryId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteDeanery') || 'Are you sure you want to delete this deanery?'}
      confirmLabel={t('delete') || 'Șterge'}
      cancelLabel={t('cancel') || 'Anulează'}
      variant="danger"
      isLoading={isLoading}
    />
  );
}
