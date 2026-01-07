import { StockMovementFormData } from '@/components/accounting/StockMovementAddModal';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate stock movement form data
 */
export function validateStockMovementForm(
  formData: StockMovementFormData,
  t: (key: string) => string
): ValidationErrors | null {
  const errors: ValidationErrors = {};

  // Required fields
  if (!formData.warehouseId?.trim()) {
    errors.warehouseId = `${t('warehouse') || 'Warehouse'} ${t('required') || 'is required'}`;
  }

  if (!formData.productId?.trim()) {
    errors.productId = `${t('product') || 'Product'} ${t('required') || 'is required'}`;
  }

  if (!formData.parishId?.trim()) {
    errors.parishId = `${t('parish') || 'Parish'} ${t('required') || 'is required'}`;
  }

  if (!formData.movementDate?.trim()) {
    errors.movementDate = `${t('date') || 'Date'} ${t('required') || 'is required'}`;
  }

  if (!formData.quantity?.trim()) {
    errors.quantity = `${t('quantity') || 'Quantity'} ${t('required') || 'is required'}`;
  } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
    errors.quantity = t('invalidQuantity') || 'Invalid quantity';
  }

  // Transfer type requires destination warehouse
  if (formData.type === 'transfer' && !formData.destinationWarehouseId?.trim()) {
    errors.destinationWarehouseId = `${t('destinationWarehouse') || 'Destination Warehouse'} ${t('required') || 'is required'}`;
  }

  // Numeric validations
  if (formData.unitCost && isNaN(parseFloat(formData.unitCost))) {
    errors.unitCost = t('invalidNumber') || 'Invalid number';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

