'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { ClientForm, ClientFormData } from '@/components/accounting/ClientForm';
import { useTranslations } from 'next-intl';

interface SupplierAddModalProps {
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
 * Modal component for adding a new supplier
 * Uses FormModal for consistent structure
 */
export function SupplierAddModal({
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
}: SupplierAddModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('add')} ${t('suppliers')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? t('creating') || 'Creating...' : t('create') || 'Create'}
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





