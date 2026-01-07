'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

interface UserRolesPageContentProps {
  locale: string;
}

/**
 * User Roles page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function UserRolesPageContent({ locale }: UserRolesPageContentProps) {
  const t = useTranslations('common');
  const { users, loading, error, assignRole, removeRole, fetchUsers } = useUserRoles();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/superadmin/roles');
        const result = await response.json();
        if (result.success) {
          setAvailableRoles(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };
    fetchRoles();
  }, []);

  const handleAssignRole = useCallback(async () => {
    if (!selectedUser || !selectedRoleId) return;
    const success = await assignRole(selectedUser, selectedRoleId);
    if (success) {
      setIsModalOpen(false);
      setSelectedUser(null);
      setSelectedRoleId('');
    }
  }, [selectedUser, selectedRoleId, assignRole]);

  const handleRemoveRole = useCallback(async (userId: string, roleId: string) => {
    await removeRole(userId, roleId);
  }, [removeRole]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('breadcrumbSuperadmin'), href: `/${locale}/dashboard/superadmin` },
    { label: t('userRoles') || 'User Roles' },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('assignUserRoles') || 'Assign User Roles'}
        className="mb-6"
      />

      {error && (
        <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-12 text-text-secondary">{t('loading')}</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">{user.name || user.email}</div>
                      <div className="text-sm text-text-secondary">{user.email}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <div key={role.id} className="flex items-center gap-2">
                              <Badge variant="primary">{role.name}</Badge>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleRemoveRole(user.id, role.id)}
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-text-muted">{t('noRoles') || 'No roles'}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedUser(user.id);
                        setIsModalOpen(true);
                      }}
                    >
                      {t('assignRole') || 'Assign Role'}
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  {t('noUsers') || 'No users available'}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Assign Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
          setSelectedRoleId('');
        }}
        title={t('assignRole') || 'Assign Role'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('selectRole') || 'Select Role'}
            </label>
            <select
              className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="">{t('selectRole') || 'Select a role'}</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
                setSelectedRoleId('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId}>
              {t('assign') || 'Assign'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

