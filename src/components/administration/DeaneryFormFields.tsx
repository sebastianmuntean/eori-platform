'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { DeaneryFormData } from './DeaneryAddModal';

interface DeaneryFormFieldsProps {
  formData: DeaneryFormData;
  dioceses: Diocese[];
  diocesesLoading?: boolean;
  formErrors?: Record<string, string>;
  isSubmitting?: boolean;
  showActiveField?: boolean;
  onFieldChange: (field: keyof DeaneryFormData, value: string | boolean) => void;
}

/**
 * Shared form fields component for deanery add/edit modals
 * Reduces code duplication between Add and Edit modals
 */
export function DeaneryFormFields({
  formData,
  dioceses,
  diocesesLoading = false,
  formErrors = {},
  isSubmitting = false,
  showActiveField = false,
  onFieldChange,
}: DeaneryFormFieldsProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof DeaneryFormData, value: string | boolean) => {
    onFieldChange(field, value);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailError = formData.email && !validateEmail(formData.email) 
    ? t('invalidEmail') || 'Invalid email format'
    : formErrors.email;

  return (
    <div className="space-y-4">
      <Select
        label={`${t('diocese') || 'Eparhie'} *`}
        value={formData.dioceseId}
        onChange={(e) => handleChange('dioceseId', e.target.value)}
        options={dioceses.map((d) => ({ value: d.id, label: d.name }))}
        placeholder={diocesesLoading ? (t('loading') || 'Loading...') : (t('selectDiocese') || 'Select Diocese')}
        required
        disabled={isSubmitting || diocesesLoading}
        error={formErrors.dioceseId}
      />
      <Input
        label={t('code') || 'Cod'}
        value={formData.code}
        onChange={(e) => handleChange('code', e.target.value)}
        required
        disabled={isSubmitting}
        error={formErrors.code}
      />
      <Input
        label={t('name') || 'Nume'}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
        disabled={isSubmitting}
        error={formErrors.name}
      />
      <Input
        label={t('address') || 'Adresă'}
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.address}
      />
      <Input
        label={t('city') || 'Oraș'}
        value={formData.city}
        onChange={(e) => handleChange('city', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.city}
      />
      <Input
        label={t('county') || 'Județ'}
        value={formData.county}
        onChange={(e) => handleChange('county', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.county}
      />
      <Input
        label={t('deanName') || 'Nume Protopop'}
        value={formData.deanName}
        onChange={(e) => handleChange('deanName', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.deanName}
      />
      <Input
        label={t('phone') || 'Telefon'}
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        disabled={isSubmitting}
        error={formErrors.phone}
      />
      <Input
        label={t('email') || 'Email'}
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        disabled={isSubmitting}
        error={emailError}
      />
      {showActiveField && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{t('active') || 'Activ'}</span>
          </label>
          {formErrors.isActive && (
            <p className="mt-1 text-sm text-danger">{formErrors.isActive}</p>
          )}
        </div>
      )}
    </div>
  );
}

