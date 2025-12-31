'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/Badge';

export default function UserRolesPage() {
  console.log('Step 1: Rendering User Roles page');

  const { users, loading, error, assignRole, removeRole, fetchUsers } = useUserRoles();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    fetch('/api/superadmin/roles')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setAvailableRoles(result.data);
        }
      });
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    console.log('Step 2: Assigning role to user');
    const success = await assignRole(selectedUser, selectedRoleId);
    if (success) {
      setIsModalOpen(false);
      setSelectedUser(null);
      setSelectedRoleId('');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    console.log('Step 2: Removing role from user');
    await removeRole(userId, roleId);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Superadmin', href: '/dashboard/superadmin' },
    { label: 'Utilizatori-Roluri' },
  ];

  console.log('✓ Rendering user roles page');
  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <h1 className="text-3xl font-bold text-text-primary">Atribuire Roluri Utilizatori</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Se încarcă...</div>
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
                          <span className="text-sm text-text-muted">Fără roluri</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedUser(user.id);
                        setIsModalOpen(true);
                      }}
                    >
                      Atribuie Rol
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  Nu există utilizatori
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
        title="Atribuie Rol"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Selectează Rol
            </label>
            <select
              className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="">Selectează un rol</option>
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
              Anulează
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId}>
              Atribuie
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

