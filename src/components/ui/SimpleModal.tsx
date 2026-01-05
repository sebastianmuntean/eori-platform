'use client';

import { ReactNode } from 'react';
import { Modal } from './Modal';

export interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  actions?: ReactNode; // Optional footer actions
}

/**
 * Reusable modal component for simple content display
 * Use this for modals that don't need form submission logic or confirmation dialogs
 * Provides consistent structure for simple content modals
 */
export function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  actions,
}: SimpleModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="space-y-4">
        {children}
        {actions && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </Modal>
  );
}


