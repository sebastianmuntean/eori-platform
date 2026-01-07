import { StockMovement } from '@/hooks/useStockMovements';
import { StockMovementFormData } from '@/components/accounting/StockMovementAddModal';

/**
 * Create empty stock movement form data
 */
export function createEmptyStockMovementFormData(): StockMovementFormData {
  return {
    warehouseId: '',
    productId: '',
    parishId: '',
    type: 'in',
    movementDate: new Date().toISOString().split('T')[0],
    quantity: '',
    unitCost: '',
    notes: '',
    destinationWarehouseId: '',
  };
}

/**
 * Map stock movement data to form data
 */
export function stockMovementToFormData(stockMovement: StockMovement): StockMovementFormData {
  return {
    warehouseId: stockMovement.warehouseId,
    productId: stockMovement.productId,
    parishId: stockMovement.parishId,
    type: stockMovement.type,
    movementDate: stockMovement.movementDate,
    quantity: stockMovement.quantity,
    unitCost: stockMovement.unitCost || '',
    notes: stockMovement.notes || '',
    destinationWarehouseId: stockMovement.destinationWarehouseId || '',
  };
}

/**
 * Convert form data to create data
 */
export function stockMovementFormDataToCreateData(formData: StockMovementFormData): Partial<StockMovement> {
  return {
    warehouseId: formData.warehouseId,
    productId: formData.productId,
    parishId: formData.parishId,
    type: formData.type,
    movementDate: formData.movementDate,
    quantity: formData.quantity,
    unitCost: formData.unitCost || null,
    notes: formData.notes || null,
    destinationWarehouseId: formData.destinationWarehouseId || null,
  };
}

/**
 * Convert form data to update data
 */
export function stockMovementFormDataToUpdateData(formData: StockMovementFormData): Partial<StockMovement> {
  return stockMovementFormDataToCreateData(formData);
}

