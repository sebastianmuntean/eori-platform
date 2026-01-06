'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { CemeteryFormData } from './CemeteryAddModal';

interface CemeteryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: CemeteryFormData;
  onFormDataChange: (data: CemeteryFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for editing an existing cemetery
 */
export function CemeteryEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
  error,
}: CemeteryEditModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof CemeteryFormData, value: string | boolean) => {
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
      title={`${t('edit')} ${t('cemeteries') || 'Cemetery'}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('update') || 'Update'}
      cancelLabel={t('cancel') || 'Cancel'}
      error={error}
    >
      <div className="space-y-4">
        <Input
          label={t('code') || 'Code'}
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('name') || 'Name'}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('address') || 'Address'}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('city') || 'City'}
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('county') || 'County'}
          value={formData.county}
          onChange={(e) => handleChange('county', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('totalArea') || 'Total Area'}
          type="number"
          value={formData.totalArea}
          onChange={(e) => handleChange('totalArea', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('totalPlots') || 'Total Plots'}
          type="number"
          value={formData.totalPlots}
          onChange={(e) => handleChange('totalPlots', e.target.value)}
          disabled={isSubmitting}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('notes') || 'Notes'}</label>
          <textarea
            className="w-full px-4 py-2 border rounded-md"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </FormModal>
  );
}

