'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteStockMovementDialogProps {
  isOpen: boolean;
  stockMovementId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a stock movement
 * Provides a consistent confirmation UI for this action
 */
export function DeleteStockMovementDialog({
  isOpen,
  stockMovementId,
  onClose,
  onConfirm,
}: DeleteStockMovementDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (stockMovementId) {
      onConfirm(stockMovementId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!stockMovementId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirm Delete'}
      message={t('confirmDeleteStockMovement') || 'Are you sure you want to delete this stock movement? This action cannot be undone.'}
      confirmLabel={t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
    />
  );
}

