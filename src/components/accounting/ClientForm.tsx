'use client';

import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';

export interface ClientFormData {
  code: string;
  firstName: string;
  lastName: string;
  cnp: string;
  birthDate: string;
  companyName: string;
  cui: string;
  regCom: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  phone: string;
  email: string;
  bankName: string;
  iban: string;
  notes: string;
  isActive: boolean;
}

interface ClientFormProps {
  formData: ClientFormData;
  clientType: 'person' | 'company' | 'organization';
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  onTypeChange: (type: 'person' | 'company' | 'organization') => void;
  onFieldChange: (field: keyof ClientFormData, value: string) => void;
  onClearError: (field: string) => void;
}

export function ClientForm({
  formData,
  clientType,
  formErrors,
  isSubmitting,
  onTypeChange,
  onFieldChange,
  onClearError,
}: ClientFormProps) {
  const t = useTranslations('common');

  const handleFieldChange = (field: keyof ClientFormData, value: string) => {
    onFieldChange(field, value);
    if (formErrors[field]) {
      onClearError(field);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('type')} *</label>
        <select
          value={clientType}
          onChange={(e) => onTypeChange(e.target.value as 'person' | 'company' | 'organization')}
          className="w-full px-3 py-2 border rounded"
          required
          disabled={isSubmitting}
        >
          <option value="person">{t('person') || 'Person'}</option>
          <option value="company">{t('company') || 'Company'}</option>
          <option value="organization">{t('organization') || 'Organization'}</option>
        </select>
      </div>

      <Input
        label={t('code')}
        value={formData.code}
        onChange={(e) => handleFieldChange('code', e.target.value)}
        required
        disabled={isSubmitting}
        error={formErrors.code}
      />

      {clientType === 'person' ? (
        <>
          <Input
            label={t('firstName') || 'First Name'}
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            disabled={isSubmitting}
            error={formErrors.firstName}
          />
          <Input
            label={t('lastName') || 'Last Name'}
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="CNP"
            value={formData.cnp}
            onChange={(e) => handleFieldChange('cnp', e.target.value)}
            disabled={isSubmitting}
            error={formErrors.cnp}
          />
          <Input
            label={t('birthDate') || 'Birth Date'}
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleFieldChange('birthDate', e.target.value)}
            disabled={isSubmitting}
          />
        </>
      ) : (
        <>
          <Input
            label={t('companyName') || 'Company Name'}
            value={formData.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            disabled={isSubmitting}
            error={formErrors.companyName}
          />
          <Input
            label="CUI"
            value={formData.cui}
            onChange={(e) => handleFieldChange('cui', e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label={t('regCom') || 'Reg. Com.'}
            value={formData.regCom}
            onChange={(e) => handleFieldChange('regCom', e.target.value)}
            disabled={isSubmitting}
          />
        </>
      )}

      <Input
        label={t('address') || 'Address'}
        value={formData.address}
        onChange={(e) => handleFieldChange('address', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label={t('city') || 'City'}
        value={formData.city}
        onChange={(e) => handleFieldChange('city', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label={t('county') || 'County'}
        value={formData.county}
        onChange={(e) => handleFieldChange('county', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label={t('postalCode') || 'Postal Code'}
        value={formData.postalCode}
        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label={t('phone') || 'Phone'}
        value={formData.phone}
        onChange={(e) => handleFieldChange('phone', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label={t('email') || 'Email'}
        type="email"
        value={formData.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.email}
      />
      <Input
        label={t('bankName') || 'Bank Name'}
        value={formData.bankName}
        onChange={(e) => handleFieldChange('bankName', e.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label="IBAN"
        value={formData.iban}
        onChange={(e) => handleFieldChange('iban', e.target.value)}
        disabled={isSubmitting}
      />
    </div>
  );
}

