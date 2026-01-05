'use client';

import { FormModal } from '@/components/accounting/FormModal';
import { PilgrimageForm, PilgrimageFormData } from './PilgrimageForm';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface PilgrimageAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  formData: PilgrimageFormData;
  setFormData: (data: PilgrimageFormData) => void;
  parishes: Parish[];
  onSubmit: () => void;
  loading?: boolean;
}

/**
 * Modal component for adding a new pilgrimage
 * Uses FormModal for consistent structure and PilgrimageForm for form fields
 */
export function PilgrimageAddModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  setFormData,
  parishes,
  onSubmit,
  loading = false,
}: PilgrimageAddModalProps) {
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={`${t('add')} ${tPilgrimages('pilgrimage')}`}
      onSubmit={onSubmit}
      isSubmitting={loading}
      submitLabel={t('create')}
      size="full"
    >
      <PilgrimageForm
        formData={formData}
        setFormData={setFormData}
        parishes={parishes}
        showStatus={false}
      />
    </FormModal>
  );
}

