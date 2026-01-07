import { useCallback, useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { AutocompleteOption } from '@/components/ui/Autocomplete';

interface UseInvoiceProductSelectionProps {
  products: Product[];
  fetchProducts: (params: { search?: string; isActive?: boolean; pageSize?: number }) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product | null>;
  formData: { parishId: string; warehouseId?: string | null };
  addProductItem: (product: Product, warehouseId?: string | null) => void;
  setNewProductInput: (value: string) => void;
  t: (key: string) => string;
}

const SEARCH_MIN_LENGTH = 2;
const PRODUCTS_PAGE_SIZE = 1000;

const initialProductFormData = {
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

export function useInvoiceProductSelection({
  products,
  fetchProducts,
  createProduct,
  formData,
  addProductItem,
  setNewProductInput,
  t,
}: UseInvoiceProductSelectionProps) {
  const [productFormData, setProductFormData] = useState(initialProductFormData);

  const getProductLabel = useCallback((product: Product) => `${product.code} - ${product.name}`, []);

  const getProductOptions = useCallback(
    (excludeProductIds: string[] = []): AutocompleteOption[] => {
      return products
        .filter((p) => !excludeProductIds.includes(p.id))
        .map((p) => ({
          value: p.id,
          label: getProductLabel(p),
          product: p,
        }));
    },
    [products, getProductLabel]
  );

  const handleProductSearch = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim().length >= SEARCH_MIN_LENGTH) {
        fetchProducts({ search: searchTerm.trim(), isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
      }
    },
    [fetchProducts]
  );

  const handleCreateProduct = useCallback(async () => {
    try {
      if (!productFormData.code || !productFormData.name) {
        alert(t('fillRequiredFields') || 'Te rugăm să completezi toate câmpurile obligatorii');
        return;
      }

      if (!formData.parishId) {
        alert(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie pentru factură înainte de a adăuga produse');
        return;
      }

      const newProduct = await createProduct({
        ...productFormData,
        parishId: formData.parishId,
        purchasePrice: productFormData.purchasePrice || null,
        salePrice: productFormData.salePrice || null,
        minStock: productFormData.minStock || null,
      });

      if (newProduct) {
        await fetchProducts({ isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
        addProductItem(newProduct, formData.warehouseId || null);
        setNewProductInput('');
        setProductFormData(initialProductFormData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Eroare la crearea produsului';
      alert(errorMessage);
      return false;
    }
  }, [productFormData, formData, createProduct, fetchProducts, addProductItem, setNewProductInput, t]);

  const resetProductForm = useCallback(() => {
    setProductFormData(initialProductFormData);
  }, []);

  return {
    productFormData,
    setProductFormData,
    getProductLabel,
    getProductOptions,
    handleProductSearch,
    handleCreateProduct,
    resetProductForm,
  };
}

