'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteClientDialogProps {
  isOpen: boolean;
  clientId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a client
 * Provides a consistent confirmation UI for this action
 */
export function DeleteClientDialog({
  isOpen,
  clientId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteClientDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (clientId) {
      onConfirm(clientId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!clientId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirm Delete'}
      message={t('confirmDeleteClient') || 'Are you sure you want to delete this client?'}
      confirmLabel={isLoading ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
      cancelLabel={t('cancel') || 'Cancel'}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

