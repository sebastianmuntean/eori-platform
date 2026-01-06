'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InventorySession } from '@/hooks/useInventory';
import { useTranslations } from 'next-intl';

interface CompleteSessionDialogProps {
  isOpen: boolean;
  session: InventorySession | null;
  onClose: () => void;
  onConfirm: (session: InventorySession) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for completing an inventory session
 * Warns users that adjustments will be automatically generated
 */
export function CompleteSessionDialog({
  isOpen,
  session,
  onClose,
  onConfirm,
  isLoading = false,
}: CompleteSessionDialogProps) {
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
      title={t('confirmComplete') || 'Confirmă finalizarea'}
      message={
        t('confirmCompleteMessage') ||
        'Sunteți sigur că doriți să finalizați această sesiune de inventar? Ajustările vor fi generate automat.'
      }
      confirmLabel={t('complete') || 'Finalizează'}
      cancelLabel={t('cancel') || 'Anulează'}
      variant="warning"
      isLoading={isLoading}
    />
  );
}

