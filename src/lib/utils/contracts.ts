import { ContractFormData } from '@/components/accounting/ContractFormFields';
import { Contract } from '@/hooks/useContracts';
import { Client } from '@/hooks/useClients';

/**
 * Create empty contract form data
 */
export function createEmptyContractFormData(): ContractFormData {
  return {
    parishId: '',
    contractNumber: '',
    direction: 'incoming',
    type: 'rental',
    status: 'draft',
    clientId: '',
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    signingDate: '',
    amount: '',
    currency: 'RON',
    paymentFrequency: 'monthly',
    assetReference: '',
    description: '',
    terms: '',
    notes: '',
    renewalDate: '',
    autoRenewal: false,
    parentContractId: '',
    invoiceItemTemplate: null,
  };
}

/**
 * Convert contract to form data
 */
export function contractToFormData(contract: Contract): ContractFormData {
  return {
    parishId: contract.parishId,
    contractNumber: contract.contractNumber,
    direction: contract.direction,
    type: contract.type,
    status: contract.status,
    clientId: contract.clientId,
    title: contract.title || '',
    startDate: contract.startDate,
    endDate: contract.endDate,
    signingDate: contract.signingDate || '',
    amount: contract.amount,
    currency: contract.currency,
    paymentFrequency: contract.paymentFrequency,
    assetReference: contract.assetReference || '',
    description: contract.description || '',
    terms: contract.terms || '',
    notes: contract.notes || '',
    renewalDate: contract.renewalDate || '',
    autoRenewal: contract.autoRenewal,
    parentContractId: contract.parentContractId || '',
    invoiceItemTemplate: (contract as any).invoiceItemTemplate || null,
  };
}

/**
 * Get client name by ID from clients array
 */
export function getClientNameById(clientId: string | null, clients: Client[]): string {
  if (!clientId) return '-';
  const client = clients.find((c) => c.id === clientId);
  if (!client) return clientId;
  return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
}

/**
 * Validate contract form data
 */
export function validateContractForm(formData: ContractFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!formData.parishId) {
    errors.push('parishId');
  }
  if (!formData.contractNumber?.trim()) {
    errors.push('contractNumber');
  }
  if (!formData.startDate) {
    errors.push('startDate');
  }
  if (!formData.endDate) {
    errors.push('endDate');
  }
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    errors.push('amount');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare contract create data from form data
 */
export function contractFormDataToCreateData(formData: ContractFormData): Omit<Contract, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'updatedBy'> {
  return {
    parishId: formData.parishId,
    contractNumber: formData.contractNumber,
    direction: formData.direction,
    type: formData.type,
    status: formData.status,
    clientId: formData.clientId,
    title: formData.title || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    signingDate: formData.signingDate || null,
    amount: formData.amount,
    currency: formData.currency,
    paymentFrequency: formData.paymentFrequency,
    assetReference: formData.assetReference || null,
    description: formData.description || null,
    terms: formData.terms || null,
    notes: formData.notes || null,
    renewalDate: formData.renewalDate || null,
    autoRenewal: formData.autoRenewal,
    parentContractId: formData.parentContractId || null,
    invoiceItemTemplate: formData.invoiceItemTemplate || null,
  };
}

/**
 * Prepare contract update data from form data
 */
export function contractFormDataToUpdateData(formData: ContractFormData): Partial<Contract> {
  return {
    parishId: formData.parishId,
    contractNumber: formData.contractNumber,
    direction: formData.direction,
    type: formData.type,
    status: formData.status,
    clientId: formData.clientId,
    title: formData.title || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    signingDate: formData.signingDate || null,
    amount: formData.amount,
    currency: formData.currency,
    paymentFrequency: formData.paymentFrequency,
    assetReference: formData.assetReference || null,
    description: formData.description || null,
    terms: formData.terms || null,
    notes: formData.notes || null,
    renewalDate: formData.renewalDate || null,
    autoRenewal: formData.autoRenewal,
    parentContractId: formData.parentContractId || null,
    invoiceItemTemplate: formData.invoiceItemTemplate || null,
  };
}

/**
 * Prepare contract update data from form data (legacy alias)
 */
export function prepareContractUpdateData(formData: ContractFormData): Partial<Contract> {
  return contractFormDataToUpdateData(formData);
}
