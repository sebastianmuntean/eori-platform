'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface DeleteEventDialogProps {
  isOpen: boolean;
  eventId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting an event
 * Provides a consistent confirmation UI for this action
 */
export function DeleteEventDialog({
  isOpen,
  eventId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteEventDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (eventId) {
      onConfirm(eventId);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen && !!eventId}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('confirmDelete')}
      message={t('confirmDeleteEvent')}
      confirmLabel={t('delete') || 'Șterge'}
      cancelLabel={t('cancel') || 'Anulează'}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

