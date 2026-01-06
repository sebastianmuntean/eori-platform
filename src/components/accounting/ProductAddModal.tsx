'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { ProductFormFields, ProductFormData } from '@/components/accounting/products/ProductFormFields';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

// Re-export ProductFormData for convenience
export type { ProductFormData };

interface ProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: ProductFormData;
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Modal component for adding a new product
 * Uses FormModal for consistent structure
 */
export function ProductAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
  error,
}: ProductAddModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('addProduct') || 'Add Product'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Save'}
      cancelLabel={t('cancel') || 'Cancel'}
      error={error}
      size="lg"
    >
      <ProductFormFields
        formData={formData}
        onFormDataChange={onFormDataChange}
        parishes={parishes}
        t={t}
      />
    </FormModal>
  );
}

