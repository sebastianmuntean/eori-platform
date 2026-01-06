/**
 * Route mappings for fixed asset categories
 */
import { FIXED_ASSET_CATEGORIES, FixedAssetCategory } from './constants';

/**
 * Map category to route segment
 */
export const CATEGORY_ROUTE_MAP: Record<FixedAssetCategory, string> = {
  [FIXED_ASSET_CATEGORIES.BUILDINGS]: 'buildings',
  [FIXED_ASSET_CATEGORIES.LAND]: 'land',
  [FIXED_ASSET_CATEGORIES.TRANSPORT]: 'transport',
  [FIXED_ASSET_CATEGORIES.PRECIOUS_OBJECTS]: 'precious-objects',
  [FIXED_ASSET_CATEGORIES.RELIGIOUS_OBJECTS]: 'religious-objects',
  [FIXED_ASSET_CATEGORIES.FURNITURE]: 'furniture',
  [FIXED_ASSET_CATEGORIES.RELIGIOUS_BOOKS]: 'religious-books',
  [FIXED_ASSET_CATEGORIES.LIBRARY_BOOKS]: 'library-books',
  [FIXED_ASSET_CATEGORIES.CULTURAL_GOODS]: 'cultural-goods',
  [FIXED_ASSET_CATEGORIES.MODERNIZATIONS]: 'modernizations',
};

/**
 * Get route path for a category
 */
export function getCategoryRoute(category: FixedAssetCategory, locale: string): string {
  return `/${locale}/dashboard/accounting/fixed-assets/registers/${CATEGORY_ROUTE_MAP[category]}`;
}







