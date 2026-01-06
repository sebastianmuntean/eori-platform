'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { Warehouse } from '@/hooks/useWarehouses';
import { InventorySession } from '@/hooks/useInventory';
import { useTranslations } from 'next-intl';

export interface InventorySessionFormData {
  parishId: string;
  warehouseId: string;
  date: string;
  notes: string;
}

interface InventorySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  session: InventorySession | null;
  formData: InventorySessionFormData;
  onFormDataChange: (data: InventorySessionFormData) => void;
  parishes: Parish[];
  warehouses: Warehouse[];
  filteredWarehouses: Warehouse[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for creating or editing inventory sessions
 * Handles both add and edit modes based on whether session is provided
 */
export function InventorySessionModal({
  isOpen,
  onClose,
  onCancel,
  session,
  formData,
  onFormDataChange,
  parishes,
  filteredWarehouses,
  onSubmit,
  isSubmitting = false,
}: InventorySessionModalProps) {
  const t = useTranslations('common');

  const handleParishChange = (parishId: string) => {
    onFormDataChange({
      ...formData,
      parishId,
      warehouseId: '', // Reset warehouse when parish changes
    });
  };

  const handleWarehouseChange = (warehouseId: string) => {
    onFormDataChange({
      ...formData,
      warehouseId,
    });
  };

  const handleDateChange = (date: string) => {
    onFormDataChange({
      ...formData,
      date,
    });
  };

  const handleNotesChange = (notes: string) => {
    onFormDataChange({
      ...formData,
      notes,
    });
  };

  const title = session
    ? t('editInventorySession') || 'Editează Sesiune Inventar'
    : t('startInventory') || 'Începe Inventar';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={title}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Salvează'}
      cancelLabel={t('cancel') || 'Anulează'}
      size="lg"
    >
      <div className="space-y-4">
        <Select
          label={t('parish') || 'Parohie'}
          value={formData.parishId}
          onChange={(e) => handleParishChange(e.target.value)}
          options={parishes.map((p) => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
        <Select
          label={t('warehouse') || 'Gestiune'}
          value={formData.warehouseId}
          onChange={(e) => handleWarehouseChange(e.target.value)}
          options={[
            { value: '', label: t('all') || 'Toate' },
            ...filteredWarehouses.map((w) => ({ value: w.id, label: w.name })),
          ]}
          disabled={isSubmitting}
        />
        <Input
          label={t('date') || 'Data'}
          type="date"
          value={formData.date}
          onChange={(e) => handleDateChange(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('notes') || 'Note'}
          value={formData.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={t('optionalNotes') || 'Note opționale...'}
          disabled={isSubmitting}
        />
      </div>
    </FormModal>
  );
}

