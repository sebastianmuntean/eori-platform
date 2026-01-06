import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';

export interface ProductFormData {
  parishId: string;
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

interface ProductFormFieldsProps {
  formData: ProductFormData;
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  parishes: Parish[];
  t: (key: string) => string;
}

export function ProductFormFields({
  formData,
  onFormDataChange,
  parishes,
  t,
}: ProductFormFieldsProps) {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <Select
        label={t('parish') || 'Parish'}
        value={formData.parishId}
        onChange={(e) => onFormDataChange({ parishId: e.target.value })}
        options={parishes.map((p) => ({ value: p.id, label: p.name }))}
        required
      />
      <Input
        label={t('code') || 'Code'}
        value={formData.code}
        onChange={(e) => onFormDataChange({ code: e.target.value })}
        required
      />
      <Input
        label={t('name') || 'Name'}
        value={formData.name}
        onChange={(e) => onFormDataChange({ name: e.target.value })}
        required
      />
      <Input
        label={t('description') || 'Description'}
        value={formData.description}
        onChange={(e) => onFormDataChange({ description: e.target.value })}
      />
      <Input
        label={t('category') || 'Category'}
        value={formData.category}
        onChange={(e) => onFormDataChange({ category: e.target.value })}
      />
      <Input
        label={t('unit') || 'Unit'}
        value={formData.unit}
        onChange={(e) => onFormDataChange({ unit: e.target.value })}
        required
      />
      <Input
        label={t('purchasePrice') || 'Purchase Price'}
        type="number"
        step="0.01"
        value={formData.purchasePrice}
        onChange={(e) => onFormDataChange({ purchasePrice: e.target.value })}
      />
      <Input
        label={t('salePrice') || 'Sale Price'}
        type="number"
        step="0.01"
        value={formData.salePrice}
        onChange={(e) => onFormDataChange({ salePrice: e.target.value })}
      />
      <Input
        label={t('vatRate') || 'VAT Rate (%)'}
        type="number"
        step="0.01"
        value={formData.vatRate}
        onChange={(e) => onFormDataChange({ vatRate: e.target.value })}
      />
      <Input
        label={t('barcode') || 'Barcode'}
        value={formData.barcode}
        onChange={(e) => onFormDataChange({ barcode: e.target.value })}
      />
      <Input
        label={t('minStock') || 'Minimum Stock'}
        type="number"
        step="0.001"
        value={formData.minStock}
        onChange={(e) => onFormDataChange({ minStock: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="trackStock"
          checked={formData.trackStock}
          onChange={(e) => onFormDataChange({ trackStock: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="trackStock" className="text-sm">
          {t('trackStock') || 'Track Stock'}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => onFormDataChange({ isActive: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="isActive" className="text-sm">
          {t('active') || 'Active'}
        </label>
      </div>
    </div>
  );
}





