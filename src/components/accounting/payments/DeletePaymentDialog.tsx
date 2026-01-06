'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeletePaymentDialogProps {
  isOpen: boolean;
  paymentId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirmation dialog for deleting a payment
 * Provides a consistent confirmation UI for this action
 */
export function DeletePaymentDialog({
  isOpen,
  paymentId,
  onClose,
  onConfirm,
}: DeletePaymentDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (paymentId) {
      onConfirm(paymentId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!paymentId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeletePayment') || t('confirmDelete')}
      confirmLabel={t('delete')}
      cancelLabel={t('cancel')}
      variant="danger"
    />
  );
}

