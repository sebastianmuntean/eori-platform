'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { PaymentFormFields, PaymentFormData } from './PaymentFormFields';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';

interface PaymentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: PaymentFormData;
  onFormDataChange: (data: Partial<PaymentFormData>) => void;
  parishes: Parish[];
  clients: Client[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for editing an existing payment
 * Uses FormModal and PaymentFormFields for consistent structure
 */
export function PaymentEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  clients,
  onSubmit,
  isSubmitting = false,
}: PaymentEditModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('edit')} ${t('payment')}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('update')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-6">
        <PaymentFormFields
          formData={formData}
          onFormDataChange={onFormDataChange}
          parishes={parishes}
          clients={clients}
          t={t}
        />
      </div>
    </FormModal>
  );
}

