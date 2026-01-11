'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { FixedAssetForm, FixedAssetFormData } from '@/components/fixed-assets/FixedAssetForm';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

// Re-export form data type for convenience
export type { FixedAssetFormData };

interface FixedAssetAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: FixedAssetFormData;
  onFormDataChange: (data: FixedAssetFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal component for adding a new fixed asset
 * Uses FormModal for consistent structure
 */
export function FixedAssetAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  onSubmit,
  isSubmitting = false,
}: FixedAssetAddModalProps) {
  const t = useTranslations('common');

  const handleChange = (data: Partial<FixedAssetFormData>) => {
    onFormDataChange({
      ...formData,
      ...data,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('addFixedAsset') || 'Add Fixed Asset'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={t('save') || 'Save'}
      cancelLabel={t('cancel') || 'Cancel'}
      size="full"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        <FixedAssetForm
          formData={formData}
          onChange={handleChange}
          parishes={parishes}
        />
      </div>
    </FormModal>
  );
}

