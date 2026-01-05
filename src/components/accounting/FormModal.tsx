'use client';

import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  error?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Reusable modal component for forms
 * Provides consistent structure for add/edit modals
 * Defaults to full screen for better UX with complex forms
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
  cancelLabel,
  error,
  size = 'full', // Default to full screen for better form UX
}: FormModalProps) {
  const t = useTranslations('common');

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="flex flex-col" style={{ height: 'calc(98vh - 80px)' }}>
        <div className="flex-1 overflow-y-auto pr-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {children}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border flex-shrink-0 bg-bg-primary">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {cancelLabel || t('cancel') || 'Cancel'}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? t('saving') || 'Saving...'
              : submitLabel || t('save') || 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


