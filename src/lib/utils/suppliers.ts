import { Client } from '@/hooks/useClients';
import { ClientFormData } from '@/components/accounting/ClientForm';
import { createEmptyClientFormData, clientToFormData } from './clients';

/**
 * Re-export client utilities for suppliers
 * Suppliers use the same Client type and form data structure
 */
export {
  createEmptyClientFormData as createEmptySupplierFormData,
  clientToFormData as supplierToFormData,
  getClientType,
  getClientDisplayName,
} from './clients';

/**
 * Convert form data to create data for suppliers
 */
export function supplierFormDataToCreateData(formData: ClientFormData): Partial<Client> {
  return {
    ...formData,
    birthDate: formData.birthDate || null,
  };
}

/**
 * Convert form data to update data for suppliers
 */
export function supplierFormDataToUpdateData(formData: ClientFormData): Partial<Client> {
  return supplierFormDataToCreateData(formData);
}

