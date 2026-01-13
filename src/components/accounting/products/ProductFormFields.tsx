import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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

interface ProductFormFieldsProps {
  formData: ProductFormData;
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  t: (key: string) => string;
}

export function ProductFormFields({
  formData,
  onFormDataChange,
  t,
}: ProductFormFieldsProps) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informații de bază */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('basicInformation') || 'Informații de Bază'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('code') || 'Cod'} *`}
            value={formData.code}
            onChange={(e) => onFormDataChange({ code: e.target.value })}
            required
          />
          <Input
            label={`${t('name') || 'Nume'} *`}
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            required
          />
          <div className="md:col-span-2">
            <Input
              label={t('description') || 'Descriere'}
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
            />
          </div>
          <Select
            label={t('category') || 'Categorie'}
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
            label={`${t('unit') || 'Unitate'} *`}
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
        </div>
      </div>

      {/* TVA și alte informații */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('vatAndOther') || 'TVA și Alte Informații'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            step="0.01"
            label={`${t('vatRate') || 'Cota TVA'} (%)`}
            value={formData.vatRate}
            onChange={(e) => onFormDataChange({ vatRate: e.target.value })}
          />
          <Input
            label={t('barcode') || 'Cod de bare'}
            value={formData.barcode}
            onChange={(e) => onFormDataChange({ barcode: e.target.value })}
          />
        </div>
      </div>

      {/* Stoc */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('stock') || 'Stoc'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              label={t('minStock') || 'Stoc minim'}
              value={formData.minStock}
              onChange={(e) => onFormDataChange({ minStock: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => onFormDataChange({ isActive: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            {t('active') || 'Activ'}
          </label>
        </div>
      </div>
    </div>
  );
}





