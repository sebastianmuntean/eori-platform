'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { WAREHOUSE_TYPE_OPTIONS, WarehouseType } from '@/lib/validations/warehouses';

export interface WarehouseFormData {
  parishId: string;
  code: string;
  name: string;
  type: WarehouseType;
  address: string;
  responsibleName: string;
  phone: string;
  email: string;
  invoiceSeries: string;
  isActive: boolean;
}

interface WarehouseAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: WarehouseFormData;
  onFormDataChange: (data: WarehouseFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

/**
 * Modal component for adding a new warehouse
 * Uses FormModal for consistent structure
 */
export function WarehouseAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
  errors = {},
}: WarehouseAddModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof WarehouseFormData, value: string | boolean) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  const handleTypeChange = (value: string) => {
    // Type-safe type change
    if (WAREHOUSE_TYPE_OPTIONS.some(opt => opt.value === value)) {
      handleChange('type', value as WarehouseType);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('addWarehouse') || 'Add Warehouse'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Save'}
      cancelLabel={t('cancel') || 'Cancel'}
      size="full"
    >
      <div className="space-y-4">
        <Select
          label={t('parish') || 'Parish'}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
          error={errors.parishId}
        />
        <Input
          label={t('code') || 'Code'}
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.code}
        />
        <Input
          label={t('name') || 'Name'}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.name}
        />
        <Select
          label={t('type') || 'Type'}
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={WAREHOUSE_TYPE_OPTIONS}
          disabled={isSubmitting}
        />
        <Input
          label={t('address') || 'Address'}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('responsibleName') || 'Responsible Name'}
          value={formData.responsibleName}
          onChange={(e) => handleChange('responsibleName', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('phone') || 'Phone'}
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('email') || 'Email'}
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.email}
        />
        <Input
          label={t('invoiceSeries') || 'Serie Factură'}
          value={formData.invoiceSeries}
          onChange={(e) => handleChange('invoiceSeries', e.target.value)}
          placeholder="ex: INV, FACT, etc."
          disabled={isSubmitting}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4"
            disabled={isSubmitting}
          />
          <label htmlFor="isActive" className="text-sm">{t('active') || 'Active'}</label>
        </div>
      </div>
    </FormModal>
  );
}

