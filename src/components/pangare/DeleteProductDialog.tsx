'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface DeleteProductDialogProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a product in pangare module
 */
export function DeleteProductDialog({
  isOpen,
  productId,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteProductDialogProps) {
  const t = useTranslations('common');

  const handleConfirm = () => {
    if (productId) {
      onConfirm(productId);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!productId}
      onClose={onClose}
      title={t('confirmDelete') || 'Confirmă ștergerea'}
    >
      <div className="space-y-4">
        <p>{t('confirmDeleteMessage') || 'Sigur doriți să ștergeți acest produs?'}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('cancel') || 'Anulează'}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
            {t('delete') || 'Șterge'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

