/**
 * Reusable modal footer component for CRUD operations
 * Eliminates duplication in BaseCRUDPage
 */

import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

export interface ModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  loading?: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
}

/**
 * Standardized modal footer for add/edit operations
 */
export function ModalFooter({
  onCancel,
  onSave,
  isSaving = false,
  loading = false,
  cancelLabel,
  saveLabel,
  savingLabel,
}: ModalFooterProps) {
  const t = useTranslations('common');

  return (
    <div className="flex gap-2 justify-end pt-4 pb-2 border-t border-border flex-shrink-0 bg-bg-primary">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isSaving || loading}
      >
        {cancelLabel || t('cancel') || 'Cancel'}
      </Button>
      <Button onClick={onSave} disabled={isSaving || loading}>
        {isSaving ? (savingLabel || t('saving') || 'Saving...') : (saveLabel || t('save') || 'Save')}
      </Button>
    </div>
  );
}


