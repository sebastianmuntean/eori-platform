import { Client } from '@/hooks/useClients';

/**
 * Get the display name for a client
 * Priority: companyName > firstName + lastName > code
 */
export function getClientDisplayName(client: Client): string {
  if (client.companyName) {
    return client.companyName;
  }
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
  return fullName || client.code;
}

/**
 * Determine client type based on available data
 */
export function getClientType(client: Client): 'person' | 'company' | 'organization' {
  if (client.companyName) {
    return 'company';
  }
  if (client.firstName || client.lastName) {
    return 'person';
  }
  return 'organization';
}

/**
 * Create empty client form data
 */
export function createEmptyClientFormData() {
  return {
    code: '',
    firstName: '',
    lastName: '',
    cnp: '',
    birthDate: '',
    companyName: '',
    cui: '',
    regCom: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    phone: '',
    email: '',
    bankName: '',
    iban: '',
    notes: '',
    isActive: true,
  };
}

/**
 * Map client data to form data
 */
export function clientToFormData(client: Client) {
  return {
    code: client.code,
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    cnp: client.cnp || '',
    birthDate: client.birthDate || '',
    companyName: client.companyName || '',
    cui: client.cui || '',
    regCom: client.regCom || '',
    address: client.address || '',
    city: client.city || '',
    county: client.county || '',
    postalCode: client.postalCode || '',
    phone: client.phone || '',
    email: client.email || '',
    bankName: client.bankName || '',
    iban: client.iban || '',
    notes: client.notes || '',
    isActive: client.isActive,
  };
}







