import { Payment } from '@/hooks/usePayments';
import { isValidEmail } from '@/lib/utils/accounting';

interface ValidationErrors {
  [key: string]: string;
}

export interface PaymentFormData {
  parishId: string;
  paymentNumber: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  clientId: string;
  amount: string;
  currency: string;
  description: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'check' | '';
  referenceNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * Validate payment form data
 */
export function validatePaymentForm(
  formData: PaymentFormData,
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formData.parishId?.trim()) {
    errors.parishId = `${t('parish')} ${t('required') || 'is required'}`;
  }

  if (!formData.paymentNumber?.trim()) {
    errors.paymentNumber = `${t('paymentNumber')} ${t('required') || 'is required'}`;
  }

  if (!formData.date) {
    errors.date = `${t('date')} ${t('required') || 'is required'}`;
  }

  if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
    errors.amount = `${t('amount')} ${t('required') || 'is required'} ${t('and') || 'and'} ${t('mustBePositive') || 'must be positive'}`;
  }

  return errors;
}

