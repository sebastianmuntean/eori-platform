'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { EventStatus } from '@/hooks/useEvents';
import { useTranslations } from 'next-intl';
import { WeddingFormData } from './types';
import { EVENT_STATUS_OPTIONS } from './constants';

interface WeddingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: WeddingFormData;
  onFormDataChange: (data: WeddingFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for editing an existing wedding event
 * Includes status field which is not available in add mode
 */
export function WeddingEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
  error,
}: WeddingEditModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof WeddingFormData, value: string) => {
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
      title={`${t('edit') || 'Editează'} ${t('wedding') || 'Nuntă'}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Salvează'}
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
        <Select
          label={t('status') || 'Status'}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as EventStatus)}
          options={EVENT_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey) || option.fallback,
          }))}
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
