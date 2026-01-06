'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InventorySession } from '@/hooks/useInventory';
import { useTranslations } from 'next-intl';

interface DeleteSessionDialogProps {
  isOpen: boolean;
  session: InventorySession | null;
  onClose: () => void;
  onConfirm: (session: InventorySession) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting an inventory session
 * Provides a consistent confirmation UI for this action
 */
export function DeleteSessionDialog({
  isOpen,
  session,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteSessionDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (session) {
      onConfirm(session);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!session}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete') || 'Confirmă ștergerea'}
      message={t('confirmDeleteMessage') || 'Sunteți sigur că doriți să ștergeți această sesiune?'}
      confirmLabel={t('delete') || 'Șterge'}
      cancelLabel={t('cancel') || 'Anulează'}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

