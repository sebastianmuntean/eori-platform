'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteWarehouseDialogProps {
  isOpen: boolean;
  warehouseId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a warehouse
 * Provides a consistent confirmation UI for this action
 */
export function DeleteWarehouseDialog({
  isOpen,
  warehouseId,
  onClose,
  onConfirm,
}: DeleteWarehouseDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (warehouseId) {
      onConfirm(warehouseId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!warehouseId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirm Delete'}
      message={t('confirmDeleteMessage') || 'Are you sure you want to delete this warehouse?'}
      confirmLabel={t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
    />
  );
}

