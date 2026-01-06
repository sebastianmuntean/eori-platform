'use client';

import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { DonationFormData } from '@/lib/validations/donations';
import { getClientDisplayName } from '@/lib/utils/accounting';
import { useMemo } from 'react';

// Type-safe payment method and status types
type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'check' | '';
type DonationStatus = 'pending' | 'completed' | 'cancelled';

interface DonationFormFieldsProps {
  formData: DonationFormData;
  onFormDataChange: (data: DonationFormData) => void;
  parishes: Parish[];
  clients: Client[];
  formErrors?: Record<string, string>;
  isSubmitting?: boolean;
}

/**
 * Shared form fields component for donation forms
 * Used by both Add and Edit modals to eliminate code duplication
 */
export function DonationFormFields({
  formData,
  onFormDataChange,
  parishes,
  clients,
  formErrors = {},
  isSubmitting = false,
}: DonationFormFieldsProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof DonationFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  // Memoize client options to avoid recalculation on every render
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: getClientDisplayName(c) })),
    [clients]
  );

  // Memoize parish options
  const parishOptions = useMemo(
    () => parishes.map((p) => ({ value: p.id, label: p.name })),
    [parishes]
  );

  // Payment method options
  const paymentMethodOptions = useMemo(
    () => [
      { value: 'cash', label: t('cash') },
      { value: 'bank_transfer', label: t('bankTransfer') },
      { value: 'card', label: t('card') },
      { value: 'check', label: t('check') },
    ],
    [t]
  );

  // Status options
  const statusOptions = useMemo(
    () => [
      { value: 'pending', label: t('pending') },
      { value: 'completed', label: t('completed') },
      { value: 'cancelled', label: t('cancelled') },
    ],
    [t]
  );

  // Type-safe handlers for select fields
  const handlePaymentMethodChange = (value: string) => {
    handleChange('paymentMethod', value as PaymentMethod);
  };

  const handleStatusChange = (value: string) => {
    handleChange('status', value as DonationStatus);
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Select
          label={`${t('parish')} *`}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishOptions}
          placeholder={t('selectParish')}
          required
          disabled={isSubmitting}
          error={formErrors.parishId}
        />
        <Input
          label={`${t('paymentNumber')} *`}
          value={formData.paymentNumber}
          onChange={(e) => handleChange('paymentNumber', e.target.value)}
          required
          disabled={isSubmitting}
          error={formErrors.paymentNumber}
        />
        <Input
          type="date"
          label={`${t('date')} *`}
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
          disabled={isSubmitting}
          error={formErrors.date}
        />
        <Select
          label={t('donor')}
          value={formData.clientId}
          onChange={(e) => handleChange('clientId', e.target.value)}
          options={clientOptions}
          placeholder={t('none')}
          disabled={isSubmitting}
          error={formErrors.clientId}
        />
        <Input
          type="number"
          step="0.01"
          label={`${t('amount')} *`}
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          required
          disabled={isSubmitting}
          error={formErrors.amount}
        />
        <Input
          label={t('currency')}
          value={formData.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          disabled={isSubmitting}
          error={formErrors.currency}
        />
        <Select
          label={t('paymentMethod')}
          value={formData.paymentMethod}
          onChange={(e) => handlePaymentMethodChange(e.target.value)}
          options={paymentMethodOptions}
          placeholder={t('none')}
          disabled={isSubmitting}
          error={formErrors.paymentMethod}
        />
        <Input
          label={t('referenceNumber')}
          value={formData.referenceNumber}
          onChange={(e) => handleChange('referenceNumber', e.target.value)}
          disabled={isSubmitting}
          error={formErrors.referenceNumber}
        />
        <Select
          label={t('status')}
          value={formData.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          options={statusOptions}
          disabled={isSubmitting}
          error={formErrors.status}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('description')}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isSubmitting}
          error={formErrors.description}
        />
      </div>
    </PageContainer>
  );
}

