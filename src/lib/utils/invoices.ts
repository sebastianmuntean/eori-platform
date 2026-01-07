import { Invoice } from '@/hooks/useInvoices';
import { InvoiceFormData } from '@/lib/validations/invoices';

/**
 * Create empty invoice form data
 */
export function createEmptyInvoiceFormData(): InvoiceFormData {
  return {
    parishId: '',
    warehouseId: '',
    series: '',
    number: undefined,
    invoiceNumber: '',
    type: 'issued',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientId: '',
    currency: 'RON',
    description: '',
    status: 'draft',
    items: [],
  };
}

/**
 * Map invoice data to form data
 */
export function invoiceToFormData(invoice: Invoice): InvoiceFormData {
  return {
    parishId: invoice.parishId,
    warehouseId: invoice.warehouseId || '',
    series: invoice.series,
    number: parseInt(invoice.number) || undefined,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    date: invoice.date,
    dueDate: invoice.dueDate,
    clientId: invoice.clientId,
    currency: invoice.currency,
    description: invoice.description || '',
    status: invoice.status,
    items: invoice.items || [],
  };
}

/**
 * Convert form data to create data
 */
export function invoiceFormDataToCreateData(formData: InvoiceFormData): Partial<Invoice> {
  return {
    ...formData,
    number: formData.number !== undefined ? String(formData.number) : undefined,
    warehouseId: formData.warehouseId || null,
    description: formData.description || null,
  };
}

/**
 * Convert form data to update data
 */
export function invoiceFormDataToUpdateData(formData: InvoiceFormData): Partial<Invoice> {
  return invoiceFormDataToCreateData(formData);
}

