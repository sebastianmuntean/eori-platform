'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteProductDialogProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a product
 * Provides a consistent confirmation UI for this action
 */
export function DeleteProductDialog({
  isOpen,
  productId,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (productId) {
      onConfirm(productId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!productId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirm Delete'}
      message={t('confirmDeleteMessage') || 'Are you sure you want to delete this product?'}
      confirmLabel={t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
    />
  );
}

