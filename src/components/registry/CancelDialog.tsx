'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDocuments } from '@/hooks/useDocuments';

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  isCreator: boolean;
  onSuccess?: () => void;
}

export function CancelDialog({
  isOpen,
  onClose,
  documentId,
  isCreator,
  onSuccess,
}: CancelDialogProps) {
  const { cancelDocument, loading } = useDocuments();
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    try {
      const success = await cancelDocument(documentId, notes || null);
      
      if (success) {
        setNotes('');
        onSuccess?.();
        onClose();
      } else {
        alert('Eroare la anulare. Vă rugăm să încercați din nou.');
      }
    } catch (error) {
      console.error('Error cancelling document:', error);
      alert('Eroare la anulare. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anulare Document" size="md">
      <div className="space-y-4">
        <div className="p-3 bg-warning/10 border border-warning rounded">
          <p className="text-sm text-warning">
            Documentul va fi marcat ca arhivat după anulare.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observații</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-bg-primary text-text-primary"
            placeholder="Motiv anulare (opțional)"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Renunță
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={loading}>
            Confirmă Anulare
          </Button>
        </div>
      </div>
    </Modal>
  );
}

