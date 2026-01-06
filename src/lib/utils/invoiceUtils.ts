import { InvoiceItem } from '@/hooks/useInvoices';

export interface ExtendedInvoiceItem extends InvoiceItem {
  productId?: string | null;
  warehouseId?: string | null;
  unitCost?: number | null;
}

/**
 * Calculate total for a single invoice item
 */
export function calculateItemTotal(item: InvoiceItem): number {
  const subtotal = item.quantity * item.unitPrice;
  const vatAmount = item.vat || 0;
  return subtotal + vatAmount;
}

/**
 * Calculate totals for all invoice items
 */
export function calculateTotals(items: InvoiceItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vat = items.reduce((sum, item) => sum + (item.vat || 0), 0);
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: string | number, currency: string = 'RON'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
}

/**
 * Calculate next invoice number
 */
export async function calculateNextNumber(
  parishId: string,
  series: string,
  type: string,
  warehouseId?: string
): Promise<number | null> {
  if (!parishId || !series || !type) return null;

  try {
    const queryParams = new URLSearchParams({
      parishId,
      series,
      type,
    });
    if (warehouseId) {
      queryParams.append('warehouseId', warehouseId);
    }

    const response = await fetch(`/api/accounting/invoices/next-number?${queryParams.toString()}`);
    const result = await response.json();

    if (result.success && result.data) {
      return result.data.nextNumber;
    }
  } catch (error) {
    console.error('Error fetching next invoice number:', error);
  }
  return null;
}

/**
 * Generate invoice number from series and number
 */
export function generateInvoiceNumber(series: string, number: number | undefined): string {
  if (!series || !number) return '';
  return `${series}-${String(number).padStart(6, '0')}`;
}





