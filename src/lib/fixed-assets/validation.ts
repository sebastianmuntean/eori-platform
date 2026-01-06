/**
 * Validation utilities for fixed assets
 */
import { FixedAssetFormData } from '@/components/fixed-assets/FixedAssetForm';

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate fixed asset form data
 * @param formData - Form data to validate
 * @returns Object with validation errors (empty if valid)
 */
export function validateFixedAssetForm(formData: FixedAssetFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!formData.parishId || formData.parishId.trim() === '') {
    errors.parishId = 'Parish is required';
  }

  if (!formData.inventoryNumber || formData.inventoryNumber.trim() === '') {
    errors.inventoryNumber = 'Inventory number is required';
  } else if (formData.inventoryNumber.length > 50) {
    errors.inventoryNumber = 'Inventory number must be 50 characters or less';
  }

  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (formData.name.length > 255) {
    errors.name = 'Name must be 255 characters or less';
  }

  // Optional field validations
  if (formData.description && formData.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less';
  }

  if (formData.type && formData.type.length > 100) {
    errors.type = 'Type must be 100 characters or less';
  }

  if (formData.location && formData.location.length > 255) {
    errors.location = 'Location must be 255 characters or less';
  }

  // Date validations
  if (formData.acquisitionDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.acquisitionDate)) {
    errors.acquisitionDate = 'Date must be in YYYY-MM-DD format';
  }

  if (formData.disposalDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.disposalDate)) {
    errors.disposalDate = 'Date must be in YYYY-MM-DD format';
  }

  // Monetary value validations
  if (formData.acquisitionValue && formData.acquisitionValue.trim() !== '') {
    const num = parseFloat(formData.acquisitionValue);
    if (isNaN(num) || num < 0) {
      errors.acquisitionValue = 'Acquisition value must be a valid positive number';
    }
  }

  if (formData.currentValue && formData.currentValue.trim() !== '') {
    const num = parseFloat(formData.currentValue);
    if (isNaN(num) || num < 0) {
      errors.currentValue = 'Current value must be a valid positive number';
    }
  }

  if (formData.disposalValue && formData.disposalValue.trim() !== '') {
    const num = parseFloat(formData.disposalValue);
    if (isNaN(num) || num < 0) {
      errors.disposalValue = 'Disposal value must be a valid positive number';
    }
  }

  // Useful life years validation
  if (formData.usefulLifeYears && formData.usefulLifeYears.trim() !== '') {
    const num = parseInt(formData.usefulLifeYears, 10);
    if (isNaN(num) || num < 1) {
      errors.usefulLifeYears = 'Useful life years must be a positive integer';
    }
  }

  // Depreciation method validation
  if (formData.depreciationMethod && formData.depreciationMethod.length > 20) {
    errors.depreciationMethod = 'Depreciation method must be 20 characters or less';
  }

  return errors;
}







