'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void>;
  title: string;
  confirmButtonText: string;
  showAccessFullHistory?: boolean;
  accessFullHistory?: boolean;
  onAccessFullHistoryChange?: (value: boolean) => void;
  excludeUserIds?: string[];
  loading?: boolean;
}

export function UserSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmButtonText,
  showAccessFullHistory = false,
  accessFullHistory = false,
  onAccessFullHistoryChange,
  excludeUserIds = [],
  loading = false,
}: UserSelectionModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setUserSearch('');
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/chat/users?pageSize=100');
      const result = await response.json();
      if (result.success) {
        setAvailableUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch('');
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleConfirm = async () => {
    if (selectedUsers.length === 0) return;
    await onConfirm(selectedUsers.map(u => u.id));
  };

  const filteredUsers = availableUsers.filter(u => {
    // Exclude users in excludeUserIds list
    if (excludeUserIds.includes(u.id)) return false;
    
    // Filter by search term
    const searchLower = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
    >
      <div className="space-y-4">
        <Input
          placeholder="Search users..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-text-muted">Selected:</span>
            {selectedUsers.map(user => (
              <Badge key={user.id} variant="primary" size="sm" className="flex items-center gap-1">
                {user.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveUser(user.id);
                  }}
                  className="hover:text-white"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {loadingUsers ? (
            <div className="text-center py-4 text-text-muted">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-text-muted">No users found</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleAddUser(user)}
                  disabled={!!selectedUsers.find(u => u.id === user.id)}
                  className={cn(
                    'w-full text-left px-4 py-2 rounded-md hover:bg-bg-secondary transition-colors',
                    selectedUsers.find(u => u.id === user.id) && 'bg-primary/20 cursor-not-allowed'
                  )}
                >
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <div className="text-sm text-text-muted">{user.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {showAccessFullHistory && selectedUsers.length > 0 && (
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accessFullHistory}
                onChange={(e) => onAccessFullHistoryChange?.(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-text-primary">
                Give new users access to full conversation history
              </span>
            </label>
            <p className="text-xs text-text-muted mt-1 ml-6">
              If unchecked, new users will only see messages from now on
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedUsers.length === 0 || loading}
            isLoading={loading}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

