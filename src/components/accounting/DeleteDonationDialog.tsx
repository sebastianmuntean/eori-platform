'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteDonationDialogProps {
  isOpen: boolean;
  donationId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a donation
 * Provides a consistent confirmation UI for this action
 */
export function DeleteDonationDialog({
  isOpen,
  donationId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteDonationDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (donationId) {
      onConfirm(donationId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!donationId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteMessage') || 'Are you sure you want to delete this donation?'}
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
      isLoading={isLoading}
    />
  );
}


