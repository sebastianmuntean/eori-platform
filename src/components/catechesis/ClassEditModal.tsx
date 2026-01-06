'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';
import { ClassFormData } from './ClassAddModal';

interface ClassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ClassFormData;
  onFormDataChange: (data: ClassFormData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for editing an existing catechesis class
 */
export function ClassEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting = false,
}: ClassEditModalProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  const handleChange = (field: keyof ClassFormData, value: string | boolean) => {
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
      title={`${tCatechesis('actions.edit')} ${tCatechesis('classes.title')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-4">
        <Input
          label={tCatechesis('classes.name')}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('classes.description')}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('classes.grade')}
          value={formData.grade}
          onChange={(e) => handleChange('grade', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('classes.startDate')}
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('classes.endDate')}
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('classes.maxStudents')}
          type="number"
          value={formData.maxStudents}
          onChange={(e) => handleChange('maxStudents', e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActiveEdit"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4"
            disabled={isSubmitting}
          />
          <label htmlFor="isActiveEdit" className="text-sm text-text-primary">
            {tCatechesis('classes.isActive')}
          </label>
        </div>
      </div>
    </FormModal>
  );
}

