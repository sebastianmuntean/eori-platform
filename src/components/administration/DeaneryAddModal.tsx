'use client';

import { useCallback } from 'react';
import { FormModal } from '@/components/accounting/FormModal';
import { Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { DeaneryFormFields } from './DeaneryFormFields';

export interface DeaneryFormData {
  dioceseId: string;
  code: string;
  name: string;
  address: string;
  city: string;
  county: string;
  deanName: string;
  phone: string;
  email: string;
  isActive: boolean;
}

interface DeaneryAddModalProps {
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
 * Modal component for adding a new deanery
 * Uses FormModal for consistent structure and DeaneryFormFields for shared fields
 */
export function DeaneryAddModal({
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
}: DeaneryAddModalProps) {
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
      title={`${t('add') || 'Adaugă'} ${t('protopopiate') || 'Protopopiat'}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? (t('creating') || 'Creating...') : t('create')}
      cancelLabel={t('cancel') || 'Anulează'}
      error={error}
    >
      <DeaneryFormFields
        formData={formData}
        dioceses={dioceses}
        diocesesLoading={diocesesLoading}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        showActiveField={false}
        onFieldChange={handleFieldChange}
      />
    </FormModal>
  );
}

