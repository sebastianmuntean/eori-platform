'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { DonationFormFields } from '@/components/accounting/DonationFormFields';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { DonationFormData } from '@/lib/validations/donations';

export type { DonationFormData };

interface DonationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: DonationFormData;
  onFormDataChange: (data: DonationFormData) => void;
  parishes: Parish[];
  clients: Client[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  formErrors?: Record<string, string>;
}

/**
 * Modal component for adding a new donation
 * Uses FormModal for consistent structure and DonationFormFields for form fields
 */
export function DonationAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  clients,
  onSubmit,
  isSubmitting = false,
  formErrors = {},
}: DonationAddModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('add')} ${t('donation')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('create')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <DonationFormFields
        formData={formData}
        onFormDataChange={onFormDataChange}
        parishes={parishes}
        clients={clients}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
}

