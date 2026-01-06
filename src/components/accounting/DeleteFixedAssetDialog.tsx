'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteFixedAssetDialogProps {
  isOpen: boolean;
  assetId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a fixed asset
 * Provides a consistent confirmation UI for this action
 */
export function DeleteFixedAssetDialog({
  isOpen,
  assetId,
  onClose,
  onConfirm,
}: DeleteFixedAssetDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (assetId) {
      onConfirm(assetId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!assetId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirm Delete'}
      message={t('confirmDeleteMessage') || 'Are you sure you want to delete this fixed asset?'}
      confirmLabel={t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
    />
  );
}

