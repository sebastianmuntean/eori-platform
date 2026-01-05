import { Client } from '@/hooks/useClients';

/**
 * Format currency amount
 */
export function formatCurrency(amount: string | number, currency: string = 'RON'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0.00 ${currency}`;
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
}

/**
 * Get client display name
 */
export function getClientDisplayName(client: Client | null | undefined): string {
  if (!client) return '-';
  
  if (client.companyName) {
    return client.companyName;
  }
  
  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
  return fullName || client.code || '-';
}

/**
 * Get client display name with additional info (for autocomplete)
 */
export function getClientDisplayNameWithInfo(client: Client): string {
  const parts: string[] = [];
  
  if (client.companyName) {
    parts.push(client.companyName);
  } else {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    if (fullName) {
      parts.push(fullName);
    }
  }
  
  if (client.code) {
    parts.push(`[${client.code}]`);
  }
  
  if (client.cnp) {
    parts.push(`CNP: ${client.cnp}`);
  }
  
  if (client.cui) {
    parts.push(`CUI: ${client.cui}`);
  }
  
  if (client.city) {
    parts.push(client.city);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Client fără nume';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate CNP (Romanian Personal Numeric Code)
 */
export function isValidCNP(cnp: string): boolean {
  if (!cnp || cnp.length !== 13) return false;
  return /^\d{13}$/.test(cnp);
}

/**
 * Validate IBAN format (basic validation)
 */
export function isValidIBAN(iban: string): boolean {
  if (!iban || iban.length < 15 || iban.length > 34) return false;
  // Basic format check: 2 letters + 2 digits + up to 30 alphanumeric
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban.replace(/\s/g, '').toUpperCase());
}

/**
 * Validate phone number (Romanian format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  // Romanian phone: +40 or 0 followed by 9 digits
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+40|0)[0-9]{9}$/.test(cleaned);
}

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null | undefined, locale: string = 'ro-RO'): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString(locale);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date | null | undefined, locale: string = 'ro-RO'): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleString(locale);
}



