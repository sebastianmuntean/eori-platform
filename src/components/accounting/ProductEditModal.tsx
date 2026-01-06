'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { ProductFormFields, ProductFormData } from '@/components/accounting/products/ProductFormFields';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface ProductEditModalProps {
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
 * Modal component for editing an existing product
 * Uses FormModal for consistent structure
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
  error,
}: ProductEditModalProps) {
  const t = useTranslations('common');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('editProduct') || 'Edit Product'}
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

