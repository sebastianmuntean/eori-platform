/**
 * Shared utilities for document status and type mappings
 * Used across registratura components to avoid duplication
 */

export type StatusVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
export type DocumentType = 'incoming' | 'outgoing' | 'internal';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface StatusInfo {
  label: string;
  variant: StatusVariant;
}

export interface PriorityInfo {
  label: string;
  variant: StatusVariant;
}

/**
 * Get status badge information
 */
export function getStatusInfo(status: string): StatusInfo {
  const statusMap: Record<string, StatusInfo> = {
    draft: { label: 'Ciornă', variant: 'info' },
    in_work: { label: 'În lucru', variant: 'warning' },
    distributed: { label: 'Repartizat', variant: 'warning' },
    resolved: { label: 'Rezolvat', variant: 'success' },
    cancelled: { label: 'Anulat', variant: 'danger' },
  };

  return statusMap[status] || { label: status, variant: 'info' };
}

/**
 * Get status label only
 */
export function getStatusLabel(status: string): string {
  return getStatusInfo(status).label;
}

/**
 * Get priority badge information
 */
export function getPriorityInfo(priority: string): PriorityInfo {
  const priorityMap: Record<string, PriorityInfo> = {
    low: { label: 'Scăzută', variant: 'info' },
    normal: { label: 'Normală', variant: 'primary' },
    high: { label: 'Ridicată', variant: 'warning' },
    urgent: { label: 'Urgentă', variant: 'danger' },
  };

  return priorityMap[priority] || { label: priority, variant: 'info' };
}

/**
 * Get priority label only
 */
export function getPriorityLabel(priority: string): string {
  return getPriorityInfo(priority).label;
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    incoming: 'Intrare',
    outgoing: 'Ieșire',
    internal: 'Intern',
  };
  return typeMap[type] || type;
}

