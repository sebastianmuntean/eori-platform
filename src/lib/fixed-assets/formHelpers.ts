/**
 * Helper functions for fixed asset form data management
 * Eliminates duplication in form initialization
 */

import { FixedAssetFormData } from '@/components/fixed-assets/FixedAssetForm';
import { FixedAsset } from '@/hooks/useFixedAssets';
import { CreateFixedAssetData, UpdateFixedAssetData } from '@/lib/types/payments';

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

/**
 * Converts FixedAssetFormData to CreateFixedAssetData
 * Converts string values to appropriate types for API
 */
export function formDataToCreateData(formData: FixedAssetFormData): CreateFixedAssetData {
  return {
    parishId: formData.parishId,
    inventoryNumber: formData.inventoryNumber,
    name: formData.name,
    description: formData.description || null,
    category: formData.category || null,
    type: formData.type || null,
    location: formData.location || null,
    acquisitionDate: formData.acquisitionDate || null,
    acquisitionValue: formData.acquisitionValue || null,
    currentValue: formData.currentValue || null,
    depreciationMethod: formData.depreciationMethod || null,
    usefulLifeYears: formData.usefulLifeYears ? parseInt(formData.usefulLifeYears, 10) : null,
    status: formData.status,
    disposalDate: formData.disposalDate || null,
    disposalValue: formData.disposalValue || null,
    disposalReason: formData.disposalReason || null,
    notes: formData.notes || null,
  };
}

/**
 * Converts FixedAssetFormData to UpdateFixedAssetData
 * Converts string values to appropriate types for API
 */
export function formDataToUpdateData(formData: FixedAssetFormData): UpdateFixedAssetData {
  return {
    parishId: formData.parishId,
    inventoryNumber: formData.inventoryNumber,
    name: formData.name,
    description: formData.description || null,
    category: formData.category || null,
    type: formData.type || null,
    location: formData.location || null,
    acquisitionDate: formData.acquisitionDate || null,
    acquisitionValue: formData.acquisitionValue || null,
    currentValue: formData.currentValue || null,
    depreciationMethod: formData.depreciationMethod || null,
    usefulLifeYears: formData.usefulLifeYears ? parseInt(formData.usefulLifeYears, 10) : null,
    status: formData.status,
    disposalDate: formData.disposalDate || null,
    disposalValue: formData.disposalValue || null,
    disposalReason: formData.disposalReason || null,
    notes: formData.notes || null,
  };
}


