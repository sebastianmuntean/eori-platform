import { ClientFormData } from '@/components/accounting/ClientForm';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate client form data
 */
export function validateClientForm(
  formData: ClientFormData,
  clientType: 'person' | 'company' | 'organization',
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Code is always required
  if (!formData.code.trim()) {
    errors.code = `${t('code')} ${t('required') || 'is required'}`;
  }

  // Type-specific validations
  if (clientType === 'person') {
    if (!formData.firstName?.trim() && !formData.lastName?.trim()) {
      errors.firstName = `${t('firstName') || 'First Name'} ${t('or') || 'or'} ${t('lastName') || 'Last Name'} ${t('required') || 'is required'}`;
    }
  } else if (clientType === 'company') {
    if (!formData.companyName?.trim()) {
      errors.companyName = `${t('companyName') || 'Company Name'} ${t('required') || 'is required'}`;
    }
  }

  // Email validation
  if (formData.email && formData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = t('invalidEmail') || 'Invalid email format';
    }
  }

  // CNP validation (Romanian Personal Numeric Code - 13 digits)
  if (formData.cnp && formData.cnp.length !== 13) {
    errors.cnp = t('cnpMustBe13Digits') || 'CNP must be 13 digits';
  }

  return errors;
}

