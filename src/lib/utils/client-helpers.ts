import { Client } from '@/hooks/useClients';

/**
 * Get client display name for UI display
 * Formats: "Company Name [CODE] | CNP: xxx | CUI: xxx | City"
 */
export function getClientDisplayName(client: Client): string {
  const parts: string[] = [];
  
  // Add name or company name
  if (client.companyName) {
    parts.push(client.companyName);
  } else {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    if (fullName) {
      parts.push(fullName);
    }
  }
  
  // Add code
  if (client.code) {
    parts.push(`[${client.code}]`);
  }
  
  // Add CNP if available
  if (client.cnp) {
    parts.push(`CNP: ${client.cnp}`);
  }
  
  // Add CUI if available
  if (client.cui) {
    parts.push(`CUI: ${client.cui}`);
  }
  
  // Add city if available
  if (client.city) {
    parts.push(client.city);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Client fără nume';
}

/**
 * Get client name for sorting and simple display
 * Returns company name or full name (first + last)
 */
export function getClientName(client: Client): string {
  if (client.companyName) {
    return client.companyName;
  }
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
  return fullName || client.code || 'Client fără nume';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



