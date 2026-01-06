'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { BookInventoryItem } from '@/hooks/useInventory';
import { useTranslations } from 'next-intl';

interface SpotCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  item: BookInventoryItem | null;
  physicalQuantity: string;
  notes: string;
  onPhysicalQuantityChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for performing spot checks on inventory items
 * Allows users to record physical quantity and notes for a specific item
 */
export function SpotCheckModal({
  isOpen,
  onClose,
  onCancel,
  item,
  physicalQuantity,
  notes,
  onPhysicalQuantityChange,
  onNotesChange,
  onSubmit,
  isSubmitting = false,
}: SpotCheckModalProps) {
  const t = useTranslations('common');

  if (!item) {
    return null;
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('spotCheck') || 'Spot Check'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Salvează'}
      cancelLabel={t('cancel') || 'Anulează'}
      size="md"
    >
      <div className="space-y-4">
        <div className="pb-2 border-b border-border">
          <p className="font-semibold text-text-primary">{item.name}</p>
          <p className="text-sm text-text-secondary">Cod: {item.code}</p>
          <p className="text-sm text-text-secondary">
            {t('bookQuantity') || 'Cantitate scriptică'}: {item.quantity.toFixed(3)} {item.unit}
          </p>
        </div>
        <Input
          label={t('physicalQuantity') || 'Cantitate fizică'}
          type="number"
          step="0.001"
          value={physicalQuantity}
          onChange={(e) => onPhysicalQuantityChange(e.target.value)}
          placeholder={item.quantity.toFixed(3)}
          disabled={isSubmitting}
        />
        <Input
          label={t('notes') || 'Note'}
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t('optionalNotes') || 'Note opționale...'}
          disabled={isSubmitting}
        />
      </div>
    </FormModal>
  );
}

