'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { ContractFormFields, ContractFormData } from './ContractFormFields';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';

// Re-export ContractFormData for convenience
export type { ContractFormData };

interface ContractAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ContractFormData;
  onFormDataChange: (data: Partial<ContractFormData>) => void;
  parishes: Parish[];
  clients: Client[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for adding a new contract
 * Uses FormModal for consistent structure and ContractFormFields for form inputs
 */
export function ContractAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  clients,
  onSubmit,
  isSubmitting = false,
}: ContractAddModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('add')} ${t('contract')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('create')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <ContractFormFields
        formData={formData}
        onFormDataChange={onFormDataChange}
        parishes={parishes}
        clients={clients}
        disabled={isSubmitting}
      />
    </FormModal>
  );
}

