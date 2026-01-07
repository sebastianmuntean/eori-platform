import { Warehouse } from '@/hooks/useWarehouses';
import { WarehouseFormData } from '@/components/accounting/WarehouseAddModal';

/**
 * Create empty warehouse form data
 */
export function createEmptyWarehouseFormData(): WarehouseFormData {
  return {
    parishId: '',
    code: '',
    name: '',
    type: 'general',
    address: '',
    responsibleName: '',
    phone: '',
    email: '',
    invoiceSeries: '',
    isActive: true,
  };
}

/**
 * Map warehouse data to form data
 */
export function warehouseToFormData(warehouse: Warehouse): WarehouseFormData {
  return {
    parishId: warehouse.parishId,
    code: warehouse.code,
    name: warehouse.name,
    type: warehouse.type,
    address: warehouse.address || '',
    responsibleName: warehouse.responsibleName || '',
    phone: warehouse.phone || '',
    email: warehouse.email || '',
    invoiceSeries: warehouse.invoiceSeries || '',
    isActive: warehouse.isActive,
  };
}

/**
 * Convert form data to create data
 */
export function warehouseFormDataToCreateData(formData: WarehouseFormData): Partial<Warehouse> {
  return {
    ...formData,
    address: formData.address || null,
    responsibleName: formData.responsibleName || null,
    phone: formData.phone || null,
    email: formData.email || null,
    invoiceSeries: formData.invoiceSeries || null,
  };
}

/**
 * Convert form data to update data
 */
export function warehouseFormDataToUpdateData(formData: WarehouseFormData): Partial<Warehouse> {
  return warehouseFormDataToCreateData(formData);
}

