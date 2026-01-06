'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';

export interface StudentFormData {
  parishId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  notes: string;
  isActive: boolean;
}

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: StudentFormData;
  onFormDataChange: (data: StudentFormData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for adding a new catechesis student
 * Uses FormModal for consistent structure
 */
export function StudentAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting = false,
}: StudentAddModalProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  const handleChange = (field: keyof StudentFormData, value: string | boolean) => {
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
      title={`${tCatechesis('actions.create')} ${tCatechesis('students.title')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? t('saving') || 'Saving...' : t('save') || 'Save'}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-4">
        <Input
          label={tCatechesis('students.firstName')}
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.lastName')}
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.dateOfBirth')}
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.parentName')}
          value={formData.parentName}
          onChange={(e) => handleChange('parentName', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.parentEmail')}
          type="email"
          value={formData.parentEmail}
          onChange={(e) => handleChange('parentEmail', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.parentPhone')}
          value={formData.parentPhone}
          onChange={(e) => handleChange('parentPhone', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={tCatechesis('students.address')}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={isSubmitting}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{tCatechesis('students.notes') || t('notes')}</label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4"
            disabled={isSubmitting}
          />
          <label htmlFor="isActive" className="text-sm text-text-primary">
            {tCatechesis('students.isActive')}
          </label>
        </div>
      </div>
    </FormModal>
  );
}

