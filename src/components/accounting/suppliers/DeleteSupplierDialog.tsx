'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteSupplierDialogProps {
  isOpen: boolean;
  supplierId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a supplier
 * Provides a consistent confirmation UI for this action
 */
export function DeleteSupplierDialog({
  isOpen,
  supplierId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteSupplierDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (supplierId) {
      onConfirm(supplierId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!supplierId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteSupplier') || 'Are you sure you want to delete this supplier?'}
      confirmLabel={t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
      isLoading={isLoading}
    />
  );
}





