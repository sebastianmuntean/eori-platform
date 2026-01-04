import { InvoiceItem } from '@/hooks/useInvoices';

interface ValidationErrors {
  [key: string]: string;
}

export interface InvoiceFormData {
  parishId: string;
  warehouseId: string;
  series: string;
  number: number | undefined;
  invoiceNumber: string;
  type: 'issued' | 'received';
  date: string;
  dueDate: string;
  clientId: string;
  currency: string;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
}

/**
 * Validate invoice form data
 */
export function validateInvoiceForm(
  formData: InvoiceFormData,
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formData.parishId?.trim()) {
    errors.parishId = `${t('parish')} ${t('required') || 'is required'}`;
  }

  if (!formData.series?.trim()) {
    errors.series = `${t('series')} ${t('required') || 'is required'}`;
  }

  if (!formData.date) {
    errors.date = `${t('date')} ${t('required') || 'is required'}`;
  }

  if (!formData.dueDate) {
    errors.dueDate = `${t('dueDate')} ${t('required') || 'is required'}`;
  }

  if (formData.date && formData.dueDate && new Date(formData.dueDate) < new Date(formData.date)) {
    errors.dueDate = t('dueDateMustBeAfterDate') || 'Due date must be after invoice date';
  }

  if (!formData.clientId?.trim()) {
    errors.clientId = `${t('clients')} ${t('required') || 'is required'}`;
  }

  if (!formData.items || formData.items.length === 0) {
    errors.items = `${t('lineItems')} ${t('required') || 'is required'}`;
  } else {
    formData.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors[`items.${index}.description`] = `${t('description')} ${t('required') || 'is required'}`;
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`items.${index}.quantity`] = `${t('quantity')} ${t('required') || 'is required'} ${t('and') || 'and'} ${t('mustBePositive') || 'must be positive'}`;
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`items.${index}.unitPrice`] = `${t('unitPrice')} ${t('required') || 'is required'} ${t('and') || 'and'} ${t('mustBePositive') || 'must be positive'}`;
      }
    });
  }

  return errors;
}

