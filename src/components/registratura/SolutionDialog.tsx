'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useUsers } from '@/hooks/useUsers';
import { useGeneralRegisterWorkflow } from '@/hooks/useGeneralRegister';

interface SolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentCreatedBy: string;
  currentUserId: string;
  onSuccess?: () => void;
}

export function SolutionDialog({
  isOpen,
  onClose,
  documentId,
  documentCreatedBy,
  currentUserId,
  onSuccess,
}: SolutionDialogProps) {
  const { users, fetchUsers } = useUsers();
  const { forwardDocument, resolveDocument, loading } = useGeneralRegisterWorkflow();

  const [actionType, setActionType] = useState<'forward' | 'resolve'>('forward');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [forwardAction, setForwardAction] = useState<'forwarded' | 'returned'>('forwarded');
  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'rejected'>('approved');
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [parentStepId, setParentStepId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers({ pageSize: 1000 });
    }
  }, [isOpen, fetchUsers]);

  const handleSubmit = async () => {
    try {
      if (actionType === 'forward') {
        if (selectedUserIds.length === 0) {
          alert('Selectați cel puțin un utilizator destinatar');
          return;
        }

        // Create workflow steps for each selected user
        for (const userId of selectedUserIds) {
          await forwardDocument(documentId, {
            parentStepId,
            toUserId: userId,
            action: forwardAction,
            notes: notes || null,
          });
        }
      } else {
        // Resolve document
        await resolveDocument(documentId, {
          resolutionStatus,
          resolution: resolution || null,
          notes: notes || null,
          workflowStepId: null,
        });
      }

      // Reset form
      setSelectedUserIds([]);
      setResolution('');
      setNotes('');
      setActionType('forward');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error in solution dialog:', error);
      alert('Eroare la procesare. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solutionare Document" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tip Acțiune</label>
          <Select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as 'forward' | 'resolve')}
            options={[
              { value: 'forward', label: 'Trimite către utilizatori' },
              { value: 'resolve', label: 'Rezolvă document (Aprobă/Respinge)' },
            ]}
          />
        </div>

        {actionType === 'forward' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Utilizatori Destinatari</label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-bg-secondary p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds([...selectedUserIds, user.id]);
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{user.name || user.email}</span>
                  </label>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-text-secondary p-2">Nu există utilizatori disponibili</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tip Forward</label>
              <Select
                value={forwardAction}
                onChange={(e) => setForwardAction(e.target.value as 'forwarded' | 'returned')}
                options={[
                  { value: 'forwarded', label: 'Forward către utilizatori noi' },
                  { value: 'returned', label: 'Retrimite către expeditor' },
                ]}
              />
            </div>
          </>
        )}

        {actionType === 'resolve' && (
          <div>
            <label className="block text-sm font-medium mb-2">Rezoluție</label>
            <Select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as 'approved' | 'rejected')}
              options={[
                { value: 'approved', label: 'Aprobat' },
                { value: 'rejected', label: 'Respins' },
              ]}
            />
          </div>
        )}

        {actionType === 'resolve' && (
          <Input
            label="Rezoluție (Detalii)"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Descriere rezoluție"
          />
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Observații</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-bg-primary text-text-primary"
            placeholder="Observații (opțional)"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Anulează
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Confirmă
          </Button>
        </div>
      </div>
    </Modal>
  );
}

