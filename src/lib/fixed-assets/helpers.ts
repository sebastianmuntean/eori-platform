/**
 * Helper functions for fixed assets
 */
import { FIXED_ASSET_CATEGORIES, CATEGORY_TRANSLATION_KEYS, FixedAssetCategory } from './constants';

/**
 * Get category options for select dropdowns
 * @param tMenu - Translation function for menu translations
 * @returns Array of category options with value and label
 */
export function getCategoryOptions(tMenu: (key: string) => string) {
  return [
    { value: '', label: tMenu('all') || 'All' },
    ...Object.values(FIXED_ASSET_CATEGORIES).map((category) => ({
      value: category,
      label: tMenu(CATEGORY_TRANSLATION_KEYS[category]) || category,
    })),
  ];
}

/**
 * Get status badge variant
 * @param status - Status value
 * @returns Badge variant
 */
export function getStatusBadgeVariant(status: string): 'success' | 'secondary' | 'danger' | 'warning' {
  const variants: Record<string, 'success' | 'secondary' | 'danger' | 'warning'> = {
    active: 'success',
    inactive: 'secondary',
    disposed: 'danger',
    damaged: 'warning',
  };
  return variants[status] || 'secondary';
}



