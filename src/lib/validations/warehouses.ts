import { WarehouseFormData } from '@/components/accounting/WarehouseAddModal';

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Warehouse type options
 */
export const WAREHOUSE_TYPES = ['general', 'retail', 'storage', 'temporary'] as const;

export type WarehouseType = typeof WAREHOUSE_TYPES[number];

/**
 * Warehouse type options for select dropdowns
 */
export const WAREHOUSE_TYPE_OPTIONS: Array<{ value: WarehouseType; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'retail', label: 'Retail' },
  { value: 'storage', label: 'Storage' },
  { value: 'temporary', label: 'Temporary' },
];

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate warehouse form data
 */
export function validateWarehouseForm(
  formData: WarehouseFormData,
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!formData.parishId?.trim()) {
    errors.parishId = `${t('parish') || 'Parish'} ${t('required') || 'is required'}`;
  }

  if (!formData.code?.trim()) {
    errors.code = `${t('code') || 'Code'} ${t('required') || 'is required'}`;
  }

  if (!formData.name?.trim()) {
    errors.name = `${t('name') || 'Name'} ${t('required') || 'is required'}`;
  }

  // Email validation (optional field, but must be valid if provided)
  if (formData.email && formData.email.trim()) {
    if (!isValidEmail(formData.email)) {
      errors.email = t('invalidEmail') || 'Invalid email format';
    }
  }

  return errors;
}

