/**
 * Utility functions for online forms module
 */

import { useTranslations } from 'next-intl';

/**
 * Get translated label for target module
 */
export function getTargetModuleLabel(
  module: string,
  tForms: ReturnType<typeof useTranslations<'online-forms'>>
): string {
  const labels: Record<string, string> = {
    registratura: tForms('targetModuleRegistratura'),
    general_register: tForms('targetModuleGeneralRegister'),
    events: tForms('targetModuleEvents'),
    clients: tForms('targetModuleClients'),
  };
  return labels[module] || module;
}

/**
 * Build fetch parameters for forms/datasets
 */
export function buildFetchParams(params: {
  page: number;
  limit: number;
  search?: string;
  parishId?: string;
  targetModule?: string;
  isActive?: boolean;
}) {
  return {
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    parishId: params.parishId || undefined,
    targetModule: params.targetModule || undefined,
    isActive: params.isActive !== undefined ? params.isActive : undefined,
  };
}

