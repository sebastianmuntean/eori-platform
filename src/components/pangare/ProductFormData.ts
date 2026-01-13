/**
 * Form data type for product forms in pangare module
 */
export interface ProductFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  vatRate: string;
  barcode: string;
  trackStock: boolean;
  minStock: string;
  isActive: boolean;
}

/**
 * Creates an empty product form data object with default values
 */
export function createEmptyProductFormData(): ProductFormData {
  return {
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'buc',
    vatRate: '19',
    barcode: '',
    trackStock: true,
    minStock: '',
    isActive: true,
  };
}

