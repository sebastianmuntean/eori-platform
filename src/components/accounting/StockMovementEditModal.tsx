'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { Warehouse } from '@/hooks/useWarehouses';
import { Product } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';
import { StockMovementFormData } from './StockMovementAddModal';

interface StockMovementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: StockMovementFormData;
  onFormDataChange: (data: StockMovementFormData) => void;
  parishes: Parish[];
  warehouses: Warehouse[];
  products: Product[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for editing an existing stock movement
 * Uses FormModal for consistent structure
 */
export function StockMovementEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  warehouses,
  products,
  onSubmit,
  isSubmitting = false,
}: StockMovementEditModalProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof StockMovementFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('editStockMovement') || 'Edit Stock Movement'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Save'}
      cancelLabel={t('cancel') || 'Cancel'}
      size="lg"
    >
      <div className="space-y-4">
        <Select
          label={t('parish') || 'Parish'}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map((p) => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
        <Select
          label={t('warehouse') || 'Warehouse'}
          value={formData.warehouseId}
          onChange={(e) => handleChange('warehouseId', e.target.value)}
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          required
          disabled={isSubmitting}
        />
        <Select
          label={t('product') || 'Product'}
          value={formData.productId}
          onChange={(e) => handleChange('productId', e.target.value)}
          options={products.filter((p) => p.trackStock).map((p) => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
        <Select
          label={t('type') || 'Type'}
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value as 'in' | 'out' | 'transfer' | 'adjustment' | 'return')}
          options={[
            { value: 'in', label: 'IN' },
            { value: 'out', label: 'OUT' },
            { value: 'transfer', label: 'TRANSFER' },
            { value: 'adjustment', label: 'ADJUSTMENT' },
            { value: 'return', label: 'RETURN' },
          ]}
          required
          disabled={isSubmitting}
        />
        {formData.type === 'transfer' && (
          <Select
            label={t('destinationWarehouse') || 'Destination Warehouse'}
            value={formData.destinationWarehouseId}
            onChange={(e) => handleChange('destinationWarehouseId', e.target.value)}
            options={warehouses.filter((w) => w.id !== formData.warehouseId).map((w) => ({ value: w.id, label: w.name }))}
            required
            disabled={isSubmitting}
          />
        )}
        <Input
          label={t('date') || 'Date'}
          type="date"
          value={formData.movementDate}
          onChange={(e) => handleChange('movementDate', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('quantity') || 'Quantity'}
          type="number"
          step="0.001"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('unitCost') || 'Unit Cost'}
          type="number"
          step="0.0001"
          value={formData.unitCost}
          onChange={(e) => handleChange('unitCost', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label={t('notes') || 'Notes'}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={isSubmitting}
        />
      </div>
    </FormModal>
  );
}

