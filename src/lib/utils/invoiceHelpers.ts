import { InvoiceFormState } from '@/hooks/useInvoiceForm';
import { ExtendedInvoiceItem, calculateItemTotal, calculateTotals } from './invoiceUtils';

/**
 * Prepare invoice data for API submission
 * Handles calculation of totals and transformation of items
 */
export function prepareInvoiceData(formData: InvoiceFormState) {
  const { total, vat, subtotal } = calculateTotals(formData.items);

  // Prepare data according to API schema
  const preparedData: any = {
    parishId: formData.parishId,
    series: formData.series || 'INV',
    type: formData.type,
    date: formData.date,
    dueDate: formData.dueDate,
    clientId: formData.clientId,
    items: formData.items.map((item) => {
      const extendedItem = item as ExtendedInvoiceItem;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vat: item.vat || 0,
        total: calculateItemTotal(item),
        productId: extendedItem.productId || null,
        warehouseId: extendedItem.warehouseId || (formData.warehouseId || null),
        unitCost: extendedItem.unitCost || null,
      };
    }),
    currency: formData.currency || 'RON',
    description: formData.description || null,
    status: formData.status || 'draft',
  };

  // Only include number if it exists (optional field)
  // Ensure it's a number, not a string
  if (formData.number !== undefined && formData.number !== null) {
    // Convert to number if it's a string or ensure it's a number
    let numValue: number;
    if (typeof formData.number === 'string') {
      numValue = parseInt(formData.number, 10);
    } else if (typeof formData.number === 'number') {
      numValue = formData.number;
    } else {
      numValue = Number(formData.number);
    }
    
    // Only include if it's a valid positive integer
    if (!isNaN(numValue) && Number.isInteger(numValue) && numValue > 0) {
      preparedData.number = numValue;
    }
    // If number is 0, negative, or invalid, don't include it (will be auto-generated)
  }

  // Only include invoiceNumber if it exists (optional field)
  if (formData.invoiceNumber) {
    preparedData.invoiceNumber = formData.invoiceNumber;
  }

  // Handle warehouseId - convert empty string to null
  if (formData.warehouseId && formData.warehouseId.trim() !== '') {
    preparedData.warehouseId = formData.warehouseId;
  } else {
    preparedData.warehouseId = null;
  }

  return preparedData;
}

/**
 * Validate invoice form data
 */
export function validateInvoiceForm(formData: InvoiceFormState, isEdit: boolean = false): string | null {
  if (!formData.parishId) {
    return 'parishRequired';
  }
  if (!formData.warehouseId) {
    return 'warehouseRequired';
  }
  if (!formData.series) {
    return 'seriesRequired';
  }
  if (isEdit && !formData.number) {
    return 'numberRequired';
  }
  if (!formData.date) {
    return 'dateRequired';
  }
  if (!formData.dueDate) {
    return 'dueDateRequired';
  }
  if (!formData.clientId) {
    return 'clientRequired';
  }
  if (formData.items.length === 0) {
    return 'itemsRequired';
  }
  return null;
}

