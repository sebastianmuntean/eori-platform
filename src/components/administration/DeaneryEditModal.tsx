'use client';

import { useCallback } from 'react';
import { FormModal } from '@/components/accounting/FormModal';
import { Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { DeaneryFormData } from './DeaneryAddModal';
import { DeaneryFormFields } from './DeaneryFormFields';

interface DeaneryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: DeaneryFormData;
  onFormDataChange: (data: DeaneryFormData) => void;
  dioceses: Diocese[];
  diocesesLoading?: boolean;
  formErrors?: Record<string, string>;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for editing an existing deanery
 * Includes isActive field which can be toggled in edit mode
 * Uses DeaneryFormFields for shared fields to reduce duplication
 */
export function DeaneryEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  dioceses,
  diocesesLoading = false,
  formErrors = {},
  onSubmit,
  isSubmitting = false,
  error = null,
}: DeaneryEditModalProps) {
  const t = useTranslations('common');

  const handleFieldChange = useCallback((field: keyof DeaneryFormData, value: string | boolean) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  }, [formData, onFormDataChange]);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('edit') || 'Editează'} ${t('protopopiate') || 'Protopopiat'}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? (t('updating') || 'Updating...') : t('save')}
      cancelLabel={t('cancel') || 'Anulează'}
      error={error}
    >
      <DeaneryFormFields
        formData={formData}
        dioceses={dioceses}
        diocesesLoading={diocesesLoading}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        showActiveField={true}
        onFieldChange={handleFieldChange}
      />
    </FormModal>
  );
}
