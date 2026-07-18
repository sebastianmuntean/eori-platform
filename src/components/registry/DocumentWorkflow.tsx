'use client';

import React, { useState, useEffect } from 'react';
import { useDocument, useRouteDocument, useResolveDocument } from '@/hooks/useDocuments';
import { useDepartments } from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface DocumentWorkflowProps {
  documentId: string;
  onWorkflowUpdate?: () => void;
}

export function DocumentWorkflow({ documentId, onWorkflowUpdate }: DocumentWorkflowProps) {
  const { workflowHistory, fetchWorkflowHistory } = useDocument();
  const { routeDocument } = useRouteDocument();
  const { resolveDocument } = useResolveDocument();
  const { departments, fetchDepartments } = useDepartments();
  const { users, fetchUsers } = useUsers();

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [routeForm, setRouteForm] = useState({
    toUserId: '',
    toDepartmentId: '',
    action: 'sent' as 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected',
    resolution: '',
    notes: '',
  });

  const [resolveForm, setResolveForm] = useState({
    resolutionStatus: 'approved' as 'approved' | 'rejected',
    resolution: '',
    notes: '',
  });

  useEffect(() => {
    fetchDepartments({ pageSize: 1000 });
    fetchUsers({ pageSize: 1000 });
    fetchWorkflowHistory(documentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const handleRoute = async () => {
    if (!routeForm.toUserId && !routeForm.toDepartmentId) {
      alert('Selectați cel puțin un destinatar (utilizator sau departament)');
      return;
    }

    setLoading(true);
    try {
      await routeDocument({
        documentId,
        toUserId: routeForm.toUserId || null,
        toDepartmentId: routeForm.toDepartmentId || null,
        action: routeForm.action,
        resolution: routeForm.resolution || null,
        notes: routeForm.notes || null,
      });
      setShowRouteForm(false);
      setRouteForm({
        toUserId: '',
        toDepartmentId: '',
        action: 'sent',
        resolution: '',
        notes: '',
      });
      await fetchWorkflowHistory(documentId);
      if (onWorkflowUpdate) onWorkflowUpdate();
    } catch (err) {
      console.error('Error routing document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await resolveDocument({
        documentId,
        resolutionStatus: resolveForm.resolutionStatus,
        resolution: resolveForm.resolution || null,
        notes: resolveForm.notes || null,
      });
      setShowResolveForm(false);
      setResolveForm({ resolutionStatus: 'approved', resolution: '', notes: '' });
      await fetchWorkflowHistory(documentId);
      if (onWorkflowUpdate) onWorkflowUpdate();
    } catch (err) {
      console.error('Error resolving document:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      sent: 'Trimis',
      received: 'Primit',
      resolved: 'Rezolvat',
      returned: 'Returnat',
      approved: 'Aprobat',
      rejected: 'Respins',
    };
    return actionMap[action] || action;
  };

  const getActionBadge = (action: string) => {
    const badgeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      sent: 'primary',
      received: 'info',
      resolved: 'success',
      returned: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return badgeMap[action] || 'info';
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => setShowRouteForm(true)}>
          Trimite Document
        </Button>
        <Button variant="success" onClick={() => setShowResolveForm(true)}>
          Rezolvă Document
        </Button>
      </div>

      {/* Route Form */}
      {showRouteForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Trimite Document</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Select
                label="Către Utilizator"
                value={routeForm.toUserId}
                onChange={(e) => setRouteForm({ ...routeForm, toUserId: e.target.value })}
                options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
                placeholder="Selectează utilizator"
              />
              <Select
                label="Către Departament"
                value={routeForm.toDepartmentId}
                onChange={(e) => setRouteForm({ ...routeForm, toDepartmentId: e.target.value })}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                placeholder="Selectează departament"
              />
              <Select
                label="Acțiune"
                value={routeForm.action}
                onChange={(e) => setRouteForm({ ...routeForm, action: e.target.value as any })}
                options={[
                  { value: 'sent', label: 'Trimis' },
                  { value: 'received', label: 'Primit' },
                  { value: 'returned', label: 'Returnat' },
                  { value: 'approved', label: 'Aprobat' },
                  { value: 'rejected', label: 'Respins' },
                ]}
              />
              <Input
                label="Rezoluție"
                value={routeForm.resolution}
                onChange={(e) => setRouteForm({ ...routeForm, resolution: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Observații</label>
                <textarea
                  value={routeForm.notes}
                  onChange={(e) => setRouteForm({ ...routeForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleRoute} isLoading={loading}>
                  Trimite
                </Button>
                <Button variant="outline" onClick={() => setShowRouteForm(false)}>
                  Anulează
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Resolve Form */}
      {showResolveForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Rezolvă Document</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rezoluție</label>
                <Select
                  value={resolveForm.resolutionStatus}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionStatus: e.target.value as 'approved' | 'rejected' })}
                  options={[
                    { value: 'approved', label: 'Aprobat' },
                    { value: 'rejected', label: 'Respins' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Detalii Rezoluție</label>
                <textarea
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                  placeholder="Descriere detaliată a rezoluției (opțional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observații</label>
                <textarea
                  value={resolveForm.notes}
                  onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="success" onClick={handleResolve} isLoading={loading}>
                  Rezolvă
                </Button>
                <Button variant="outline" onClick={() => setShowResolveForm(false)}>
                  Anulează
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Workflow History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Istoric Workflow</h3>
        </CardHeader>
        <CardBody>
          {workflowHistory.length === 0 ? (
            <p className="text-text-secondary">Nu există istoric workflow</p>
          ) : (
            <div className="space-y-4">
              {workflowHistory.map((item) => (
                <div key={item.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getActionBadge(item.action)}>
                      {getActionLabel(item.action)}
                    </Badge>
                    <span className="text-sm text-text-secondary">
                      {new Date(item.createdAt).toLocaleString('ro-RO')}
                    </span>
                  </div>
                  {item.resolution && (
                    <p className="text-sm text-text-primary mb-1">
                      <strong>Rezoluție:</strong> {item.resolution}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-sm text-text-secondary">
                      <strong>Observații:</strong> {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

