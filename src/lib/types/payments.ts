/**
 * Payment types and interfaces
 * Separates API request/response types from database entity types
 */

import { Payment } from '@/hooks/usePayments';

/**
 * Payment data for creating a new payment
 * Amount is a number (as expected by API)
 */
export interface CreatePaymentData {
  parishId: string;
  paymentNumber: string;
  date: string;
  type: 'income' | 'expense';
  category?: string | null;
  clientId?: string | null;
  amount: number; // Number for API, converted to string in database
  currency?: string;
  description?: string | null;
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'check' | null;
  referenceNumber?: string | null;
  status?: 'pending' | 'completed' | 'cancelled';
}

/**
 * Payment data for updating an existing payment
 * All fields are optional except those required for update
 */
export type UpdatePaymentData = Partial<CreatePaymentData>;

/**
 * Quick Payment form data (frontend)
 */
export interface QuickPaymentFormData {
  parishId: string;
  clientId: string;
  clientDisplayName: string;
  amount: string; // String from input, converted to number for API
  reason: string;
  category: string;
  sendEmail: boolean;
  emailAddress: string;
}

/**
 * Quick Payment API request data
 */
export interface QuickPaymentRequest {
  parishId: string;
  clientId: string;
  amount: number;
  reason: string;
  category: string;
  sendEmail?: boolean;
  emailAddress?: string;
}

/**
 * Convert Payment entity (from database) to CreatePaymentData format
 * Used when editing an existing payment
 */
export function paymentToCreateData(payment: Payment): CreatePaymentData {
  return {
    parishId: payment.parishId,
    paymentNumber: payment.paymentNumber,
    date: payment.date,
    type: payment.type,
    category: payment.category,
    clientId: payment.clientId,
    amount: parseFloat(payment.amount),
    currency: payment.currency,
    description: payment.description,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
  };
}

/**
 * Convert QuickPaymentFormData to QuickPaymentRequest
 * Validates and converts amount from string to number
 */
export function quickPaymentFormToRequest(
  formData: QuickPaymentFormData
): QuickPaymentRequest | { error: string } {
  // Validate required fields
  if (!formData.parishId || !formData.clientId || !formData.amount || !formData.reason.trim() || !formData.category) {
    return { error: 'All required fields must be filled' };
  }

  // Validate and parse amount
  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Invalid amount' };
  }

  if (amount > 999999999.99) {
    return { error: 'Amount exceeds maximum allowed' };
  }

  // Validate email if sendEmail is checked
  if (formData.sendEmail) {
    if (!formData.emailAddress.trim()) {
      return { error: 'Email address is required when sending receipt' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      return { error: 'Invalid email address' };
    }
  }

  return {
    parishId: formData.parishId,
    clientId: formData.clientId,
    amount,
    reason: formData.reason.trim(),
    category: formData.category,
    sendEmail: formData.sendEmail,
    emailAddress: formData.sendEmail ? formData.emailAddress.trim() : undefined,
  };
}


