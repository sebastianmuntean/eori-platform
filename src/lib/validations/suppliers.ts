import { ClientFormData } from '@/components/accounting/ClientForm';
import { validateClientForm } from './clients';

/**
 * Suppliers use the same validation as clients
 * This is a convenience export for consistency
 */
export { validateClientForm as validateSupplierForm };

export type SupplierFormData = ClientFormData;







