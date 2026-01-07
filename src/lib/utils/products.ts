import { Product } from '@/hooks/useProducts';
import { ProductFormData } from '@/components/accounting/products/ProductFormFields';

/**
 * Create empty product form data
 */
export function createEmptyProductFormData(): ProductFormData {
  return {
    parishId: '',
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'buc',
    purchasePrice: '',
    salePrice: '',
    vatRate: '19',
    barcode: '',
    trackStock: true,
    minStock: '',
    isActive: true,
  };
}

/**
 * Map product data to form data
 */
export function productToFormData(product: Product): ProductFormData {
  return {
    parishId: product.parishId,
    code: product.code,
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    unit: product.unit,
    purchasePrice: product.purchasePrice || '',
    salePrice: product.salePrice || '',
    vatRate: product.vatRate,
    barcode: product.barcode || '',
    trackStock: product.trackStock,
    minStock: product.minStock || '',
    isActive: product.isActive,
  };
}

/**
 * Convert form data to create data
 */
export function productFormDataToCreateData(formData: ProductFormData): Partial<Product> {
  return {
    ...formData,
    purchasePrice: formData.purchasePrice || null,
    salePrice: formData.salePrice || null,
    minStock: formData.minStock || null,
    description: formData.description || null,
    category: formData.category || null,
    barcode: formData.barcode || null,
  };
}

/**
 * Convert form data to update data
 */
export function productFormDataToUpdateData(formData: ProductFormData): Partial<Product> {
  return productFormDataToCreateData(formData);
}

