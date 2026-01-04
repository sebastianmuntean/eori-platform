'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useUsers, User } from '@/hooks/useUsers';
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
  const { users, fetchUsers, loading: usersLoading } = useUsers();
  const { forwardDocument, resolveDocument, loading } = useGeneralRegisterWorkflow();

  const [actionType, setActionType] = useState<'forward' | 'resolve'>('forward');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [forwardAction, setForwardAction] = useState<'forwarded' | 'returned'>('forwarded');
  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'rejected'>('approved');
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [parentStepId, setParentStepId] = useState<string | null>(null);
  
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers({ pageSize: 100 });
    }
  }, [isOpen, fetchUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setSelectedUsers([]);
      setUserSearch('');
      setResolution('');
      setNotes('');
      setActionType('forward');
      setIsUserDropdownOpen(false);
    }
  }, [isOpen]);

  // Handle user search with debouncing
  const handleUserSearch = useCallback((searchTerm: string) => {
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }
    
    if (searchTerm && searchTerm.length >= 2) {
      userSearchTimeoutRef.current = setTimeout(() => {
        fetchUsers({
          search: searchTerm,
          pageSize: 50,
        });
      }, 300);
    } else if (!searchTerm) {
      fetchUsers({ pageSize: 100 });
    }
  }, [fetchUsers]);

  useEffect(() => {
    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserDropdownOpen]);

  const handleAddUser = (user: User) => {
    if (!selectedUserIds.includes(user.id)) {
      setSelectedUserIds([...selectedUserIds, user.id]);
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch('');
    setIsUserDropdownOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => {
    if (selectedUserIds.includes(u.id)) return false;
    const searchLower = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  });

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
      setSelectedUsers([]);
      setResolution('');
      setNotes('');
      setActionType('forward');
      setUserSearch('');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error in solution dialog:', error);
      alert('Eroare la procesare. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solutionare Document" size="full">
      <div className="space-y-6 h-full flex flex-col">
        {/* Action Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* User Selection (for forward) */}
        {actionType === 'forward' && (
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium mb-2">Utilizatori Destinatari *</label>
            
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-md border border-border">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="primary" size="sm" className="flex items-center gap-1">
                    {user.name || user.email}
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="hover:text-white ml-1"
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* User Search Autocomplete */}
            <div className="relative flex-1 flex flex-col min-h-0" ref={userDropdownRef}>
              <Input
                placeholder="Caută utilizatori (minim 2 caractere)..."
                value={userSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserSearch(value);
                  setIsUserDropdownOpen(true);
                  handleUserSearch(value);
                }}
                onFocus={() => setIsUserDropdownOpen(true)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              
              {isUserDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-bg-primary border border-border rounded-md shadow-lg max-h-96 overflow-auto">
                  {usersLoading ? (
                    <div className="px-4 py-3 text-center text-text-secondary text-sm">
                      Se încarcă...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="px-4 py-3 text-center text-text-secondary text-sm">
                      {userSearch.length < 2 ? 'Introduceți minim 2 caractere pentru căutare' : 'Nu s-au găsit utilizatori'}
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleAddUser(user)}
                          className="w-full text-left px-4 py-2 hover:bg-bg-secondary transition-colors"
                        >
                          <div className="font-medium text-text-primary">{user.name || 'Fără nume'}</div>
                          <div className="text-sm text-text-secondary">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resolution Details (for resolve) */}
        {actionType === 'resolve' && (
          <div>
            <Input
              label="Rezoluție (Detalii)"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Descriere rezoluție"
            />
          </div>
        )}

        {/* Observations */}
        <div>
          <label className="block text-sm font-medium mb-2">Observații</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
            placeholder="Observații (opțional)"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Anulează
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={loading}>
            Confirmă
          </Button>
        </div>
      </div>
    </Modal>
  );
}

