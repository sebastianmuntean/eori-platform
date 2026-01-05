'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { PilgrimageForm, PilgrimageFormData } from './PilgrimageForm';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface PilgrimageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: PilgrimageFormData;
  setFormData: (data: PilgrimageFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  loading?: boolean;
}

/**
 * Modal component for editing an existing pilgrimage
 * Uses FormModal for consistent structure and PilgrimageForm for form fields
 * Includes status field which is not available in add mode
 */
export function PilgrimageEditModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  setFormData,
  parishes,
  onSubmit,
  loading = false,
}: PilgrimageEditModalProps) {
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('edit')} ${tPilgrimages('pilgrimage')}`}
      onSubmit={onSubmit}
      isSubmitting={loading}
      submitLabel={t('save')}
      size="full"
    >
      <PilgrimageForm
        formData={formData}
        setFormData={setFormData}
        parishes={parishes}
        showStatus={true}
      />
    </FormModal>
  );
}

