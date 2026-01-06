import { FormModal } from '@/components/accounting/FormModal';
import { InvoiceFormFields, InvoiceFormData } from './InvoiceFormFields';
import { InvoiceItemsSection } from './InvoiceItemsSection';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { Warehouse } from '@/hooks/useWarehouses';
import { Product } from '@/hooks/useProducts';
import { ExtendedInvoiceItem } from '@/lib/utils/invoiceUtils';
import { AutocompleteOption } from '@/components/ui/Autocomplete';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  title: string;
  formData: InvoiceFormData & { items: ExtendedInvoiceItem[] };
  onFormDataChange: (data: Partial<InvoiceFormData & { items: ExtendedInvoiceItem[] }>) => void;
  onAddLineItem: () => void;
  onAddProduct: (product: Product) => void;
  onUpdateItem: (index: number, field: keyof ExtendedInvoiceItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  newProductInput: string;
  onNewProductInputChange: (value: string) => void;
  onOpenAddProductModal: () => void;
  parishes: Parish[];
  warehouses: Warehouse[];
  clients: Client[];
  products: Product[];
  productsLoading: boolean;
  onProductSearch: (searchTerm: string) => void;
  getProductLabel: (product: Product) => string;
  getProductOptions: (excludeProductIds?: string[]) => AutocompleteOption[];
  onTypeChange?: (type: 'issued' | 'received') => void;
  t: (key: string) => string;
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onCancel,
  onSubmit,
  title,
  formData,
  onFormDataChange,
  onAddLineItem,
  onAddProduct,
  onUpdateItem,
  onRemoveItem,
  newProductInput,
  onNewProductInputChange,
  onOpenAddProductModal,
  parishes,
  warehouses,
  clients,
  products,
  productsLoading,
  onProductSearch,
  getProductLabel,
  getProductOptions,
  onTypeChange,
  t,
}: InvoiceFormModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={title}
      onSubmit={onSubmit}
      isSubmitting={false}
      submitLabel={t('create')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-6">
        <InvoiceFormFields
          formData={formData}
          onFormDataChange={onFormDataChange}
          onTypeChange={onTypeChange}
          parishes={parishes}
          warehouses={warehouses}
          clients={clients}
          t={t}
        />
        <InvoiceItemsSection
          items={formData.items}
          invoiceType={formData.type}
          currency={formData.currency}
          newProductInput={newProductInput}
          onNewProductInputChange={onNewProductInputChange}
          onAddLineItem={onAddLineItem}
          onAddProduct={onAddProduct}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          onOpenAddProductModal={onOpenAddProductModal}
          products={products}
          productsLoading={productsLoading}
          onProductSearch={onProductSearch}
          getProductLabel={getProductLabel}
          getProductOptions={getProductOptions}
          t={t}
        />
      </div>
    </FormModal>
  );
}





