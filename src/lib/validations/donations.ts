import { Donation } from '@/hooks/useDonations';
import { validatePaymentForm, PaymentFormData } from './payments';

interface ValidationErrors {
  [key: string]: string;
}

export interface DonationFormData {
  parishId: string;
  paymentNumber: string;
  date: string;
  clientId: string;
  amount: string;
  currency: string;
  description: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'check' | '';
  referenceNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * Validate donation form data
 * Donations are essentially payments with type='income' and category='donation'
 */
export function validateDonationForm(
  formData: DonationFormData,
  t: (key: string) => string
): ValidationErrors {
  // Use payment validation as base
  const paymentFormData: PaymentFormData = {
    ...formData,
    type: 'income',
    category: 'donation',
  };

  return validatePaymentForm(paymentFormData, t);
}



