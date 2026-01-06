'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { ClientForm, ClientFormData } from '@/components/accounting/ClientForm';
import { useTranslations } from 'next-intl';

interface SupplierEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ClientFormData;
  clientType: 'person' | 'company' | 'organization';
  formErrors: Record<string, string>;
  onTypeChange: (type: 'person' | 'company' | 'organization') => void;
  onFieldChange: (field: keyof ClientFormData, value: string) => void;
  onClearError: (field: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for editing an existing supplier
 */
export function SupplierEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  clientType,
  formErrors,
  onTypeChange,
  onFieldChange,
  onClearError,
  onSubmit,
  isSubmitting = false,
  error = null,
}: SupplierEditModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('edit')} ${t('suppliers')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? t('updating') || 'Updating...' : t('update') || 'Update'}
      cancelLabel={t('cancel')}
      error={error}
    >
      <ClientForm
        formData={formData}
        clientType={clientType}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onTypeChange={onTypeChange}
        onFieldChange={onFieldChange}
        onClearError={onClearError}
      />
    </FormModal>
  );
}





