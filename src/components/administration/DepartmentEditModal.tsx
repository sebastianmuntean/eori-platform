'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { DepartmentFormData } from './DepartmentAddModal';

interface DepartmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: DepartmentFormData;
  onFormDataChange: (data: DepartmentFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for editing an existing department
 * Uses FormModal for consistent structure
 */
export function DepartmentEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
}: DepartmentEditModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof DepartmentFormData, value: string | boolean) => {
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
      title={`${t('edit')} ${t('departamente')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('update')}
      cancelLabel={t('cancel')}
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        <Select
          label={`${t('parish')} *`}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map((p) => ({ value: p.id, label: p.name }))}
          placeholder={t('selectParish')}
          required
          disabled={isSubmitting}
        />
        <Input
          label={`${t('code')} *`}
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={`${t('name')} *`}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('description')}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('headName')}
          value={formData.headName}
          onChange={(e) => handleChange('headName', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('phone')}
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('email')}
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={isSubmitting}
          error={
            formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
              ? t('invalidEmail') || 'Invalid email format'
              : undefined
          }
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
          <label htmlFor="isActiveEdit" className="text-sm font-medium">
            {t('active')}
          </label>
        </div>
      </div>
    </FormModal>
  );
}

