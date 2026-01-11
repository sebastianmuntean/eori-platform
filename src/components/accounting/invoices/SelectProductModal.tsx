import { useState, useEffect, useMemo, useCallback } from 'react';
import { FormModal } from '@/components/accounting/FormModal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Table } from '@/components/ui/Table';
import { Product } from '@/hooks/useProducts';
import { useStockLevels } from '@/hooks/useStockLevels';

interface SelectProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  productsLoading: boolean;
  onProductSearch: (searchTerm: string) => void;
  invoiceType: 'issued' | 'received';
  warehouseId?: string | null;
  excludeProductIds?: string[];
  t: (key: string) => string;
}

interface ProductWithStock extends Product {
  availableStock?: number;
}

export function SelectProductModal({
  isOpen,
  onClose,
  onCancel,
  onSelect,
  products,
  productsLoading,
  onProductSearch,
  invoiceType,
  warehouseId,
  excludeProductIds = [],
  t,
}: SelectProductModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { stockLevels, fetchStockLevels, loading: stockLoading } = useStockLevels();

  // Fetch stock levels for issued invoices when warehouse is selected
  useEffect(() => {
    if (isOpen && invoiceType === 'issued' && warehouseId) {
      fetchStockLevels({ warehouseId });
    }
  }, [isOpen, invoiceType, warehouseId, fetchStockLevels]);

  // Create a map of productId -> stock quantity for quick lookup
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stockLevels.forEach((level) => {
      if (Number(level.quantity) > 0) {
        map.set(level.productId, Number(level.quantity));
      }
    });
    return map;
  }, [stockLevels]);

  // Filter products based on invoice type and stock availability
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => !excludeProductIds.includes(p.id));

    // For issued invoices, only show products with available stock in the selected warehouse
    if (invoiceType === 'issued' && warehouseId) {
      filtered = filtered.filter((p) => {
        // Include products that don't track stock (services, utilities)
        if (!p.trackStock) {
          return true;
        }
        // Include products that have stock in the warehouse
        return stockMap.has(p.id);
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code?.toLowerCase().includes(searchLower) ||
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, excludeProductIds, invoiceType, warehouseId, stockMap, searchTerm]);

  // Enrich products with stock information
  const productsWithStock = useMemo((): ProductWithStock[] => {
    return filteredProducts.map((product) => ({
      ...product,
      availableStock: product.trackStock ? stockMap.get(product.id) : undefined,
    }));
  }, [filteredProducts, stockMap]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value.trim().length >= 2) {
        onProductSearch(value.trim());
      }
    },
    [onProductSearch]
  );

  const handleSelect = useCallback(
    (product: ProductWithStock) => {
      // For issued invoices with stock products, verify stock is available
      if (invoiceType === 'issued' && product.trackStock && warehouseId) {
        const stock = stockMap.get(product.id);
        if (!stock || stock <= 0) {
          alert(t('productOutOfStock') || `Produsul ${product.name} nu are stoc disponibil în gestiunea selectată`);
          return;
        }
      }
      onSelect(product);
      onClose();
    },
    [invoiceType, warehouseId, stockMap, onSelect, onClose, t]
  );

  const columns = useMemo(
    () => [
      {
        key: 'code' as keyof ProductWithStock,
        label: t('code'),
        render: (_: any, product: ProductWithStock) => product.code || '-',
      },
      {
        key: 'name' as keyof ProductWithStock,
        label: t('name'),
        render: (_: any, product: ProductWithStock) => product.name,
      },
      {
        key: 'unit' as keyof ProductWithStock,
        label: t('unit'),
        render: (_: any, product: ProductWithStock) => product.unit || '-',
      },
      ...(invoiceType === 'issued' && warehouseId
        ? [
            {
              key: 'availableStock' as keyof ProductWithStock,
              label: t('availableStock') || 'Stoc Disponibil',
              render: (_: any, product: ProductWithStock) => {
                if (!product.trackStock) {
                  return <span className="text-text-secondary">{t('service') || 'Serviciu'}</span>;
                }
                const stock = product.availableStock ?? 0;
                return (
                  <span className={stock > 0 ? 'text-success' : 'text-danger'}>
                    {stock.toFixed(3)} {product.unit || ''}
                  </span>
                );
              },
            },
          ]
        : []),
      {
        key: 'actions' as keyof ProductWithStock,
        label: t('actions'),
        render: (_: any, product: ProductWithStock) => (
          <button
            onClick={() => handleSelect(product)}
            className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark"
            disabled={invoiceType === 'issued' && product.trackStock && !!warehouseId && !stockMap.has(product.id)}
          >
            {t('select')}
          </button>
        ),
      },
    ],
    [invoiceType, warehouseId, stockMap, handleSelect, t]
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('selectProduct') || 'Selectează Produs'}
      onSubmit={() => {}} // No submit, selection is done via button
      isSubmitting={false}
      submitLabel={t('select')}
      cancelLabel={t('cancel')}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            placeholder={t('searchProducts') || 'Caută produse...'}
          />
        </div>

        {invoiceType === 'issued' && !warehouseId && (
          <div className="bg-warning/10 border border-warning rounded p-3 text-sm text-warning">
            {t('pleaseSelectWarehouse') || 'Vă rugăm să selectați o gestiune pentru a vedea stocul disponibil'}
          </div>
        )}

        {productsLoading || stockLoading ? (
          <div className="text-center py-8">{t('loading')}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {searchTerm
              ? t('noProductsFound') || 'Nu s-au găsit produse'
              : invoiceType === 'issued' && warehouseId
              ? t('noProductsWithStock') || 'Nu există produse cu stoc disponibil în această gestiune'
              : t('noProducts') || 'Nu există produse'}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table data={productsWithStock} columns={columns} />
          </div>
        )}
      </div>
    </FormModal>
  );
}

