'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteContractDialogProps {
  isOpen: boolean;
  contractId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a contract
 * Provides a consistent confirmation UI for this action
 */
export function DeleteContractDialog({
  isOpen,
  contractId,
  onClose,
  onConfirm,
}: DeleteContractDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (contractId) {
      onConfirm(contractId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!contractId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteMessage') || 'Are you sure you want to delete this contract?'}
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
    />
  );
}





