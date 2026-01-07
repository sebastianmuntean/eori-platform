import { ProductFormData } from '@/components/accounting/products/ProductFormFields';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate product form data
 */
export function validateProductForm(
  formData: ProductFormData,
  t: (key: string) => string
): ValidationErrors | null {
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

  if (!formData.unit?.trim()) {
    errors.unit = `${t('unit') || 'Unit'} ${t('required') || 'is required'}`;
  }

  // Numeric validations
  if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
    errors.purchasePrice = t('invalidNumber') || 'Invalid number';
  }

  if (formData.salePrice && isNaN(parseFloat(formData.salePrice))) {
    errors.salePrice = t('invalidNumber') || 'Invalid number';
  }

  if (formData.vatRate && isNaN(parseFloat(formData.vatRate))) {
    errors.vatRate = t('invalidNumber') || 'Invalid number';
  }

  if (formData.minStock && isNaN(parseFloat(formData.minStock))) {
    errors.minStock = t('invalidNumber') || 'Invalid number';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

