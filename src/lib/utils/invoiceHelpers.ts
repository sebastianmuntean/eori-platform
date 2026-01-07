import { InvoiceFormState } from '@/hooks/useInvoiceForm';
import { ExtendedInvoiceItem, calculateItemTotal, calculateTotals } from './invoiceUtils';

/**
 * Prepare invoice data for API submission
 * Handles calculation of totals and transformation of items
 */
export function prepareInvoiceData(formData: InvoiceFormState) {
  const { total, vat, subtotal } = calculateTotals(formData.items);

  return {
    ...formData,
    series: formData.series,
    number: formData.number?.toString() || '',
    warehouseId: formData.warehouseId || null,
    amount: subtotal.toString(),
    vat: vat.toString(),
    total: total.toString(),
    items: formData.items.map((item) => {
      const extendedItem = item as ExtendedInvoiceItem;
      return {
        ...item,
        total: calculateItemTotal(item),
        productId: extendedItem.productId || null,
        warehouseId: extendedItem.warehouseId || (formData.warehouseId || null),
        unitCost: extendedItem.unitCost || null,
      };
    }),
  };
}

/**
 * Validate invoice form data
 */
export function validateInvoiceForm(formData: InvoiceFormState, isEdit: boolean = false): string | null {
  if (!formData.parishId) {
    return 'parishRequired';
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

