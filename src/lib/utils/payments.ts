import { Payment } from '@/hooks/usePayments';
import { PaymentFormData } from '@/lib/validations/payments';
import { CreatePaymentData, UpdatePaymentData } from '@/lib/types/payments';

/**
 * Create empty payment form data
 */
export function createEmptyPaymentFormData(): PaymentFormData {
  return {
    parishId: '',
    paymentNumber: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: '',
    clientId: '',
    amount: '',
    currency: 'RON',
    description: '',
    paymentMethod: '',
    referenceNumber: '',
    status: 'pending',
  };
}

/**
 * Map payment data to form data
 */
export function paymentToFormData(payment: Payment): PaymentFormData {
  return {
    parishId: payment.parishId,
    paymentNumber: payment.paymentNumber,
    date: payment.date,
    type: payment.type,
    category: payment.category || '',
    clientId: payment.clientId || '',
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description || '',
    paymentMethod: payment.paymentMethod || '',
    referenceNumber: payment.referenceNumber || '',
    status: payment.status,
  };
}

/**
 * Convert form data to create data
 */
export function paymentFormDataToCreateData(formData: PaymentFormData): CreatePaymentData {
  return {
    parishId: formData.parishId,
    paymentNumber: formData.paymentNumber,
    date: formData.date,
    type: formData.type,
    category: formData.category || null,
    clientId: formData.clientId || null,
    amount: parseFloat(formData.amount) || 0,
    currency: formData.currency,
    description: formData.description || null,
    paymentMethod: formData.paymentMethod || null,
    referenceNumber: formData.referenceNumber || null,
    status: formData.status,
  };
}

/**
 * Convert form data to update data
 */
export function paymentFormDataToUpdateData(formData: PaymentFormData): UpdatePaymentData {
  return paymentFormDataToCreateData(formData);
}

