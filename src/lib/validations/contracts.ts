import { ContractFormData } from '@/components/accounting/ContractFormFields';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate contract form data
 */
export function validateContractForm(
  formData: ContractFormData,
  t: (key: string) => string
): ValidationErrors | null {
  const errors: ValidationErrors = {};

  // Required fields
  if (!formData.parishId?.trim()) {
    errors.parishId = `${t('parish') || 'Parish'} ${t('required') || 'is required'}`;
  }

  if (!formData.contractNumber?.trim()) {
    errors.contractNumber = `${t('contractNumber') || 'Contract Number'} ${t('required') || 'is required'}`;
  }

  if (!formData.clientId?.trim()) {
    errors.clientId = `${t('client') || 'Client'} ${t('required') || 'is required'}`;
  }

  if (!formData.startDate?.trim()) {
    errors.startDate = `${t('startDate') || 'Start Date'} ${t('required') || 'is required'}`;
  }

  if (!formData.endDate?.trim()) {
    errors.endDate = `${t('endDate') || 'End Date'} ${t('required') || 'is required'}`;
  }

  // Date validations
  if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
    errors.endDate = t('endDateMustBeAfterStartDate') || 'End date must be after start date';
  }

  if (formData.signingDate && formData.startDate && new Date(formData.signingDate) > new Date(formData.startDate)) {
    errors.signingDate = t('signingDateMustBeBeforeStartDate') || 'Signing date must be before start date';
  }

  // Amount validation
  if (formData.amount && (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) < 0)) {
    errors.amount = t('invalidAmount') || 'Invalid amount';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

