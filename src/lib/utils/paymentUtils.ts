/**
 * Payment utility functions
 */

export type PaymentStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'check';

/**
 * Format currency amount
 */
export function formatCurrency(amount: string | number, currency: string = 'RON'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
}

/**
 * Validate payment amount
 */
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }
  
  if (num > 999999999.99) {
    return { valid: false, error: 'Amount exceeds maximum allowed' };
  }
  
  return { valid: true };
}

/**
 * Get payment status badge variant
 */
export function getStatusVariant(status: PaymentStatus): 'warning' | 'success' | 'danger' {
  const variantMap: Record<PaymentStatus, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
  };
  return variantMap[status] || 'warning';
}

/**
 * Get payment type badge variant
 */
export function getTypeVariant(type: PaymentType): 'success' | 'danger' {
  return type === 'income' ? 'success' : 'danger';
}

/**
 * Get payment method display name
 */
export function getPaymentMethodLabel(method: PaymentMethod | null | undefined, t: (key: string) => string): string {
  if (!method) return '-';
  
  const methodMap: Record<PaymentMethod, string> = {
    cash: t('cash'),
    bank_transfer: t('bankTransfer'),
    card: t('card'),
    check: t('check'),
  };
  
  return methodMap[method] || method;
}





