'use client';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { ProductFormData } from './ProductFormData';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ProductFormData;
  onFormDataChange: (data: ProductFormData) => void;
  parishes: Parish[];
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
  parishes,
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
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Select
          label={`${t('parish') || 'Parohie'} *`}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
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
        <Input
          label={t('description') || 'Descriere'}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('category') || 'Categorie'}
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={`${t('unit') || 'Unitate'} *`}
          value={formData.unit}
          onChange={(e) => handleChange('unit', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('purchasePrice') || 'Preț de cumpărare'}
          type="number"
          step="0.01"
          value={formData.purchasePrice}
          onChange={(e) => handleChange('purchasePrice', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('salePrice') || 'Preț de vânzare'}
          type="number"
          step="0.01"
          value={formData.salePrice}
          onChange={(e) => handleChange('salePrice', e.target.value)}
          disabled={isSubmitting}
        />
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
        <Input
          label={t('minStock') || 'Stoc minim'}
          type="number"
          step="0.001"
          value={formData.minStock}
          onChange={(e) => handleChange('minStock', e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="trackStock-edit"
            checked={formData.trackStock}
            onChange={(e) => handleChange('trackStock', e.target.checked)}
            className="w-4 h-4"
            disabled={isSubmitting}
          />
          <label htmlFor="trackStock-edit" className="text-sm">{t('trackStock') || 'Urmărire stoc'}</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive-edit"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4"
            disabled={isSubmitting}
          />
          <label htmlFor="isActive-edit" className="text-sm">{t('active') || 'Activ'}</label>
        </div>
        <div className="flex gap-2 justify-end">
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

