import { Button } from '@/components/ui/Button';
import { Autocomplete, AutocompleteOption } from '@/components/ui/Autocomplete';
import { InvoiceItemRow } from './InvoiceItemRow';
import { ExtendedInvoiceItem, calculateTotals, formatCurrency } from '@/lib/utils/invoiceUtils';
import { Product } from '@/hooks/useProducts';

interface InvoiceItemsSectionProps {
  items: ExtendedInvoiceItem[];
  invoiceType: 'issued' | 'received';
  currency: string;
  newProductInput: string;
  onNewProductInputChange: (value: string) => void;
  onAddLineItem: () => void;
  onAddProduct: (product: Product) => void;
  onUpdateItem: (index: number, field: keyof ExtendedInvoiceItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  onOpenAddProductModal: () => void;
  products: Product[];
  productsLoading: boolean;
  onProductSearch: (searchTerm: string) => void;
  getProductLabel: (product: Product) => string;
  getProductOptions: (excludeProductIds?: string[]) => AutocompleteOption[];
  t: (key: string) => string;
}

export function InvoiceItemsSection({
  items,
  invoiceType,
  currency,
  newProductInput,
  onNewProductInputChange,
  onAddLineItem,
  onAddProduct,
  onUpdateItem,
  onRemoveItem,
  onOpenAddProductModal,
  products,
  productsLoading,
  onProductSearch,
  getProductLabel,
  getProductOptions,
  t,
}: InvoiceItemsSectionProps) {
  const { subtotal, vat, total } = calculateTotals(items);
  const excludeIds = items
    .map((item) => item.productId)
    .filter((id): id is string => !!id);

  const handleProductSelect = (label: string) => {
    if (label && products.some((p) => getProductLabel(p) === label)) {
      const product = products.find((p) => getProductLabel(p) === label);
      if (product && !excludeIds.includes(product.id)) {
        onAddProduct(product);
      }
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold">
          {invoiceType === 'received' ? (t('products') || 'Produse') : (t('lineItems') || 'Linii Factură')} *
        </label>
        {invoiceType === 'received' ? (
          <div className="flex items-center gap-2">
            <div className="w-64">
              <Autocomplete
                value={newProductInput}
                onChange={(label) => {
                  onNewProductInputChange(label);
                  handleProductSelect(label);
                }}
                options={getProductOptions(excludeIds)}
                placeholder={t('selectProduct') || 'Selectează Produs'}
                loading={productsLoading}
                onSearch={onProductSearch}
                getOptionLabel={(option) => option.label}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onOpenAddProductModal}>
              +
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onAddLineItem}>
            {t('add')} {t('lineItems')}
          </Button>
        )}
      </div>
      <div className="space-y-2 border rounded p-2">
        {items.length === 0 ? (
          <p className="text-sm text-text-secondary">{t('noData')}</p>
        ) : (
          items.map((item, index) => (
            <InvoiceItemRow
              key={index}
              item={item}
              index={index}
              invoiceType={invoiceType}
              currency={currency}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              t={t}
            />
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="mt-4 text-right space-y-1">
          <div className="text-sm">
            {t('total')}: {formatCurrency(subtotal, currency)}
          </div>
          <div className="text-sm">
            {t('vat')}: {formatCurrency(vat, currency)}
          </div>
          <div className="text-lg font-bold">
            {t('total')}: {formatCurrency(total, currency)}
          </div>
        </div>
      )}
    </div>
  );
}





