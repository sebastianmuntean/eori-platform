'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUsers, User } from '@/hooks/useUsers';

interface GeneralRegisterEditFormProps {
  onSave: (data: {
    subject: string;
    description?: string | null;
    solutionStatus: 'approved' | 'rejected' | 'redirected' | null;
    distributedUserIds: string[];
    dueDate?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    subject?: string;
    description?: string | null;
    dueDate?: string | null;
    notes?: string | null;
  };
}

export function GeneralRegisterEditForm({ 
  onSave, 
  onCancel, 
  loading: externalLoading, 
  initialData 
}: GeneralRegisterEditFormProps) {
  const { users, fetchUsers, loading: usersLoading } = useUsers();
  
  // Calculate default due date: today + 30 days
  const getDefaultDueDate = (): string => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);
    // Format as YYYY-MM-DD for date input
    return dueDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    subject: initialData?.subject || '',
    description: initialData?.description || '',
    solutionStatus: null as 'approved' | 'rejected' | 'redirected' | null,
    dueDate: initialData?.dueDate || getDefaultDueDate(),
    notes: initialData?.notes || '',
  });
  
  // Store only user IDs, derive users when needed
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        subject: initialData.subject ?? prev.subject,
        description: initialData.description ?? prev.description,
        dueDate: initialData.dueDate ?? prev.dueDate,
        notes: initialData.notes ?? prev.notes,
      }));
    }
  }, [initialData]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers({ pageSize: 100 });
  }, [fetchUsers]);

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

  // Cleanup timeout on unmount
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

  // Derive selected users from IDs
  const selectedUsers = useMemo(() => {
    return users.filter(u => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  // Memoize filtered users for performance
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (selectedUserIds.includes(u.id)) return false;
      const searchLower = userSearch.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    });
  }, [users, selectedUserIds, userSearch]);

  const handleAddUser = useCallback((user: User) => {
    if (!selectedUserIds.includes(user.id)) {
      setSelectedUserIds(prev => [...prev, user.id]);
    }
    setUserSearch('');
    setIsUserDropdownOpen(false);
  }, [selectedUserIds]);

  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  }, []);

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value ?? '' }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      // Validation
      if (!formData.subject.trim()) {
        setErrors({ subject: 'Subiectul este obligatoriu' });
        setLoading(false);
        return;
      }

      // If redirected is selected, validate that users are selected
      if (formData.solutionStatus === 'redirected' && selectedUserIds.length === 0) {
        setErrors({ solutionStatus: 'Selectați cel puțin un utilizator pentru redirecționare' });
        setLoading(false);
        return;
      }

      const saveData = {
        subject: formData.subject.trim(),
        description: formData.description.trim() || null,
        solutionStatus: formData.solutionStatus,
        distributedUserIds: formData.solutionStatus === 'redirected' ? selectedUserIds : [],
        dueDate: formData.dueDate || null,
        notes: formData.notes.trim() || null,
      };

      await onSave(saveData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la salvare. Vă rugăm să încercați din nou.';
      setSubmitError(errorMessage);
      console.error('[GeneralRegisterEditForm] Error saving document:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear user selection when solution status changes away from redirected
  useEffect(() => {
    if (formData.solutionStatus !== 'redirected') {
      setSelectedUserIds([]);
    }
  }, [formData.solutionStatus]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Submit Error Display */}
      {submitError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-md text-danger text-sm">
          {submitError}
        </div>
      )}

      {/* Subject */}
      <div>
        <Input
          label="Subiect *"
          value={formData.subject}
          onChange={(e) => handleFieldChange('subject', e.target.value)}
          error={errors.subject}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Descriere</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
          placeholder="Descrierea documentului..."
        />
      </div>

      {/* Solution */}
      <div>
        <Select
          label="Solutionare"
          value={formData.solutionStatus || ''}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({ 
              ...prev, 
              solutionStatus: value ? (value as 'approved' | 'rejected' | 'redirected') : null 
            }));
          }}
          options={[
            { value: '', label: 'Fără solutionare' },
            { value: 'approved', label: 'Aprobă' },
            { value: 'rejected', label: 'Respinge' },
            { value: 'redirected', label: 'Redirecționează' },
          ]}
          error={errors.solutionStatus}
          placeholder="Selectează solutionare"
        />
      </div>

      {/* User Selection (when Redirect is selected) */}
      {formData.solutionStatus === 'redirected' && (
        <div className="flex flex-col min-h-0">
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
                    aria-label={`Remove ${user.name || user.email}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* User Search Autocomplete */}
          <div className="relative flex flex-col min-h-0" ref={userDropdownRef}>
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

      {/* Due Date */}
      <div>
        <Input
          label="Termen"
          type="date"
          value={formData.dueDate}
          onChange={(e) => handleFieldChange('dueDate', e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Observații</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
          placeholder="Observații (opțional)"
        />
      </div>
    </form>
  );
}
