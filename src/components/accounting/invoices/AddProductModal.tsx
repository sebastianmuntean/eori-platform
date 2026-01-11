import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface ProductFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchasePrice: string;
  salePrice: string;
  vatRate: string;
  barcode: string;
  trackStock: boolean;
  minStock: string;
  isActive: boolean;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  formData: ProductFormData;
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  t: (key: string) => string;
}

export function AddProductModal({
  isOpen,
  onClose,
  onCancel,
  onSubmit,
  formData,
  onFormDataChange,
  t,
}: AddProductModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('addProduct') || 'Adaugă Produs'}
      onSubmit={onSubmit}
      isSubmitting={false}
      submitLabel={t('create')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label={`${t('code')} *`}
          value={formData.code}
          onChange={(e) => onFormDataChange({ code: e.target.value })}
          required
        />
        <Input
          label={`${t('name')} *`}
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          required
        />
        <Input
          label={t('description')}
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
        />
        <Select
          label={t('category')}
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
          options={[
            { value: '', label: t('select') || 'Selectează...' },
            { value: 'pangar', label: 'Pangar' },
            { value: 'material', label: 'Material' },
            { value: 'service', label: 'Serviciu' },
            { value: 'fixed', label: 'Mijloc Fix' },
            { value: 'other', label: 'Altele' },
          ]}
        />
        <Select
          label={`${t('unit')} *`}
          value={formData.unit}
          onChange={(e) => onFormDataChange({ unit: e.target.value })}
          options={[
            { value: 'buc', label: 'Bucată (buc)' },
            { value: 'kg', label: 'Kilogram (kg)' },
            { value: 'g', label: 'Gram (g)' },
            { value: 'l', label: 'Litru (l)' },
            { value: 'ml', label: 'Mililitru (ml)' },
            { value: 'm', label: 'Metru (m)' },
            { value: 'cm', label: 'Centimetru (cm)' },
            { value: 'm2', label: 'Metru pătrat (m²)' },
            { value: 'm3', label: 'Metru cub (m³)' },
            { value: 'pachet', label: 'Pachet' },
            { value: 'cutie', label: 'Cutie' },
            { value: 'set', label: 'Set' },
            { value: 'pereche', label: 'Pereche' },
          ]}
          required
        />
        <Input
          type="number"
          step="0.01"
          label={t('purchasePrice')}
          value={formData.purchasePrice}
          onChange={(e) => onFormDataChange({ purchasePrice: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          label={t('salePrice')}
          value={formData.salePrice}
          onChange={(e) => onFormDataChange({ salePrice: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          label={t('vatRate')}
          value={formData.vatRate}
          onChange={(e) => onFormDataChange({ vatRate: e.target.value })}
        />
        <Input
          label={t('barcode')}
          value={formData.barcode}
          onChange={(e) => onFormDataChange({ barcode: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="trackStock"
            checked={formData.trackStock}
            onChange={(e) => onFormDataChange({ trackStock: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="trackStock" className="text-sm font-medium">
            {t('trackStock') || 'Urmărește stoc'}
          </label>
        </div>
        {formData.trackStock && (
          <Input
            type="number"
            step="0.001"
            label={t('minStock')}
            value={formData.minStock}
            onChange={(e) => onFormDataChange({ minStock: e.target.value })}
          />
        )}
      </div>
    </FormModal>
  );
}





