'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { BaptismFormData } from './types';

interface BaptismAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: BaptismFormData;
  onFormDataChange: (data: BaptismFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for adding a new baptism event
 * Uses FormModal for consistent structure
 */
export function BaptismAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
  error,
}: BaptismAddModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof BaptismFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('add') || 'Adaugă'} ${t('baptism') || 'Botez'}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('create')}
      cancelLabel={t('cancel') || 'Anulează'}
      error={error}
    >
      <div className="space-y-4">
        <Select
          label={`${t('parish') || 'Parohie'} *`}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map((p) => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('date') || 'Data'}
          type="date"
          value={formData.eventDate}
          onChange={(e) => handleChange('eventDate', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('location') || 'Locație'}
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('priest') || 'Preot'}
          value={formData.priestName}
          onChange={(e) => handleChange('priestName', e.target.value)}
          disabled={isSubmitting}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('notes') || 'Observații'}</label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </FormModal>
  );
}

