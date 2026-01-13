'use client';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { ProductFormData } from './ProductFormData';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ProductFormData;
  onFormDataChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for editing an existing product in pangare module
 */
export function ProductEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting = false,
}: ProductEditModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editProduct') || 'Editează Produs'}
      size="full"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Informații de bază */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('basicInformation') || 'Informații de Bază'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`${t('code') || 'Cod'} *`}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              label={`${t('name') || 'Nume'} *`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={isSubmitting}
            />
            <div className="md:col-span-2">
              <Input
                label={t('description') || 'Descriere'}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Input
              label={t('category') || 'Categorie'}
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSubmitting}
            />
            <Select
              label={`${t('unit') || 'Unitate'} *`}
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
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
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* TVA și alte informații */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('vatAndOther') || 'TVA și Alte Informații'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('vatRate') || 'Cota TVA (%)'}
              type="number"
              step="0.01"
              value={formData.vatRate}
              onChange={(e) => handleChange('vatRate', e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label={t('barcode') || 'Cod de bare'}
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              disabled={isSubmitting}
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
                id="trackStock-edit"
                checked={formData.trackStock}
                onChange={(e) => handleChange('trackStock', e.target.checked)}
                className="w-4 h-4"
                disabled={isSubmitting}
              />
              <label htmlFor="trackStock-edit" className="text-sm font-medium">{t('trackStock') || 'Urmărire stoc'}</label>
            </div>
            {formData.trackStock && (
              <Input
                label={t('minStock') || 'Stoc minim'}
                type="number"
                step="0.001"
                value={formData.minStock}
                onChange={(e) => handleChange('minStock', e.target.value)}
                disabled={isSubmitting}
              />
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive-edit"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4"
              disabled={isSubmitting}
            />
            <label htmlFor="isActive-edit" className="text-sm font-medium">{t('active') || 'Activ'}</label>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('cancel') || 'Anulează'}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {t('save') || 'Salvează'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

