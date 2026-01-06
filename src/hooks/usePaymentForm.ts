import { useState, useCallback } from 'react';
import { Payment } from '@/hooks/usePayments';
import { paymentToCreateData } from '@/lib/types/payments';
import { validateAmount } from '@/lib/utils/paymentUtils';

export interface PaymentFormState {
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

const getInitialFormData = (): PaymentFormState => ({
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
});

export function usePaymentForm() {
  const [formData, setFormData] = useState<PaymentFormState>(getInitialFormData());

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, []);

  const updateFormData = useCallback((updates: Partial<PaymentFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadPayment = useCallback((payment: Payment) => {
    const paymentData = paymentToCreateData(payment);
    setFormData({
      parishId: paymentData.parishId,
      paymentNumber: paymentData.paymentNumber,
      date: paymentData.date,
      type: paymentData.type,
      category: paymentData.category || '',
      clientId: paymentData.clientId || '',
      amount: paymentData.amount.toString(),
      currency: paymentData.currency || 'RON',
      description: paymentData.description || '',
      paymentMethod: paymentData.paymentMethod || '',
      referenceNumber: paymentData.referenceNumber || '',
      status: paymentData.status || 'pending',
    });
  }, []);

  const validateForm = useCallback(
    (t: (key: string) => string): { valid: boolean; error?: string } => {
      if (!formData.parishId || !formData.paymentNumber || !formData.date || !formData.amount) {
        return { valid: false, error: t('fillRequiredFields') || 'Please fill all required fields' };
      }

      const amountValidation = validateAmount(formData.amount);
      if (!amountValidation.valid) {
        return { valid: false, error: t(amountValidation.error || 'invalidAmount') || amountValidation.error };
      }

      return { valid: true };
    },
    [formData]
  );

  const toCreateData = useCallback(() => {
    const amount = parseFloat(formData.amount);
    return {
      parishId: formData.parishId,
      paymentNumber: formData.paymentNumber,
      date: formData.date,
      type: formData.type,
      amount,
      currency: formData.currency,
      category: formData.category || null,
      clientId: formData.clientId || null,
      description: formData.description || null,
      paymentMethod: formData.paymentMethod || null,
      referenceNumber: formData.referenceNumber || null,
      status: formData.status,
    };
  }, [formData]);

  return {
    formData,
    resetForm,
    updateFormData,
    loadPayment,
    validateForm,
    toCreateData,
  };
}





