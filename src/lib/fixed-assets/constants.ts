/**
 * Fixed Asset Categories
 * Centralized constants for fixed asset categories to avoid magic strings
 */
export const FIXED_ASSET_CATEGORIES = {
  BUILDINGS: 'cladiri',
  LAND: 'terenuri',
  TRANSPORT: 'transport',
  PRECIOUS_OBJECTS: 'materiale_pretioase',
  RELIGIOUS_OBJECTS: 'obiecte_cult',
  FURNITURE: 'mobilier',
  RELIGIOUS_BOOKS: 'carti_cult',
  LIBRARY_BOOKS: 'carti_biblioteca',
  CULTURAL_GOODS: 'bunuri_culturale',
  MODERNIZATIONS: 'modernizari',
} as const;

export type FixedAssetCategory = typeof FIXED_ASSET_CATEGORIES[keyof typeof FIXED_ASSET_CATEGORIES];

/**
 * Category to translation key mapping
 */
export const CATEGORY_TRANSLATION_KEYS: Record<FixedAssetCategory, string> = {
  [FIXED_ASSET_CATEGORIES.BUILDINGS]: 'buildings',
  [FIXED_ASSET_CATEGORIES.LAND]: 'land',
  [FIXED_ASSET_CATEGORIES.TRANSPORT]: 'transport',
  [FIXED_ASSET_CATEGORIES.PRECIOUS_OBJECTS]: 'preciousObjects',
  [FIXED_ASSET_CATEGORIES.RELIGIOUS_OBJECTS]: 'religiousObjects',
  [FIXED_ASSET_CATEGORIES.FURNITURE]: 'furniture',
  [FIXED_ASSET_CATEGORIES.RELIGIOUS_BOOKS]: 'religiousBooks',
  [FIXED_ASSET_CATEGORIES.LIBRARY_BOOKS]: 'libraryBooks',
  [FIXED_ASSET_CATEGORIES.CULTURAL_GOODS]: 'culturalGoods',
  [FIXED_ASSET_CATEGORIES.MODERNIZATIONS]: 'modernizations',
};

/**
 * Fixed Asset Status Types
 */
export const FIXED_ASSET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISPOSED: 'disposed',
  DAMAGED: 'damaged',
} as const;

export type FixedAssetStatus = typeof FIXED_ASSET_STATUS[keyof typeof FIXED_ASSET_STATUS];







