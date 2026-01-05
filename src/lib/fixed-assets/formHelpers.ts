/**
 * Helper functions for fixed asset form data management
 * Eliminates duplication in form initialization
 */

import { FixedAssetFormData } from '@/components/fixed-assets/FixedAssetForm';
import { FixedAsset } from '@/hooks/useFixedAssets';

/**
 * Creates initial form data with default values
 */
export function createInitialFormData(
  defaultCategory?: string,
  defaultStatus: FixedAssetFormData['status'] = 'active'
): FixedAssetFormData {
  return {
    parishId: '',
    inventoryNumber: '',
    name: '',
    description: '',
    category: defaultCategory || '',
    type: '',
    location: '',
    acquisitionDate: '',
    acquisitionValue: '',
    currentValue: '',
    depreciationMethod: '',
    usefulLifeYears: '',
    status: defaultStatus,
    disposalDate: '',
    disposalValue: '',
    disposalReason: '',
    notes: '',
  };
}

/**
 * Converts a FixedAsset to form data
 */
export function assetToFormData(
  asset: FixedAsset,
  defaultCategory?: string
): FixedAssetFormData {
  return {
    parishId: asset.parishId,
    inventoryNumber: asset.inventoryNumber,
    name: asset.name,
    description: asset.description || '',
    category: asset.category || defaultCategory || '',
    type: asset.type || '',
    location: asset.location || '',
    acquisitionDate: asset.acquisitionDate || '',
    acquisitionValue: asset.acquisitionValue || '',
    currentValue: asset.currentValue || '',
    depreciationMethod: asset.depreciationMethod || '',
    usefulLifeYears: asset.usefulLifeYears?.toString() || '',
    status: asset.status,
    disposalDate: asset.disposalDate || '',
    disposalValue: asset.disposalValue || '',
    disposalReason: asset.disposalReason || '',
    notes: asset.notes || '',
  };
}


