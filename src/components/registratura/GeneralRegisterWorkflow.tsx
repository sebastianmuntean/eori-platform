'use client';

import React, { useState, useEffect } from 'react';
import { useGeneralRegisterWorkflow } from '@/hooks/useGeneralRegister';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface GeneralRegisterWorkflowProps {
  documentId: string;
  onWorkflowUpdate?: () => void;
}

interface WorkflowStepNode {
  id: string;
  documentId: string;
  parentStepId: string | null;
  fromUserId: string | null;
  toUserId: string | null;
  action: 'sent' | 'forwarded' | 'returned' | 'approved' | 'rejected' | 'cancelled';
  stepStatus: 'pending' | 'completed';
  resolutionStatus: 'approved' | 'rejected' | null;
  resolution: string | null;
  notes: string | null;
  isExpired: boolean;
  createdAt: string;
  completedAt: string | null;
  children: WorkflowStepNode[];
  fromUserName?: string;
  toUserName?: string;
}

export function GeneralRegisterWorkflow({ documentId, onWorkflowUpdate }: GeneralRegisterWorkflowProps) {
  const { workflowSteps, workflowTree, loading, error, fetchWorkflow } = useGeneralRegisterWorkflow();

  useEffect(() => {
    if (documentId) {
      fetchWorkflow(documentId);
    }
  }, [documentId, fetchWorkflow]);

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      sent: 'Trimis',
      forwarded: 'Forward',
      returned: 'Returnat',
      approved: 'Aprobat',
      rejected: 'Respins',
      cancelled: 'Anulat',
    };
    return actionMap[action] || action;
  };

  const getActionBadge = (action: string, resolutionStatus: string | null) => {
    if (resolutionStatus === 'approved') {
      return 'success';
    }
    if (resolutionStatus === 'rejected') {
      return 'danger';
    }
    if (action === 'cancelled') {
      return 'danger';
    }
    if (action === 'approved') {
      return 'success';
    }
    if (action === 'rejected') {
      return 'danger';
    }
    return 'primary';
  };

  const getStatusBadge = (status: string) => {
    return status === 'pending' ? 'warning' : 'success';
  };

  const renderStep = (step: WorkflowStepNode, level: number = 0) => {
    const indent = level * 24;
    
    return (
      <div key={step.id} className="mb-4">
        <div
          className="border-l-4 border-primary pl-4 py-3 bg-bg-secondary rounded-r"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={getActionBadge(step.action, step.resolutionStatus) as any}>
                {getActionLabel(step.action)}
              </Badge>
              <Badge variant={getStatusBadge(step.stepStatus) as any}>
                {step.stepStatus === 'pending' ? 'În așteptare' : 'Finalizat'}
              </Badge>
              {step.resolutionStatus && (
                <Badge variant={step.resolutionStatus === 'approved' ? 'success' : 'danger'}>
                  {step.resolutionStatus === 'approved' ? 'Aprobat' : 'Respins'}
                </Badge>
              )}
            </div>
            <span className="text-sm text-text-secondary">
              {new Date(step.createdAt).toLocaleString('ro-RO')}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            {step.fromUserName && (
              <p className="text-text-secondary">
                <strong>De la:</strong> {step.fromUserName}
              </p>
            )}
            {step.toUserName && (
              <p className="text-text-secondary">
                <strong>Către:</strong> {step.toUserName}
              </p>
            )}
            {step.resolution && (
              <p className="text-text-primary">
                <strong>Rezoluție:</strong> {step.resolution}
              </p>
            )}
            {step.notes && (
              <p className="text-text-secondary">
                <strong>Observații:</strong> {step.notes}
              </p>
            )}
            {step.completedAt && (
              <p className="text-text-secondary">
                <strong>Finalizat la:</strong> {new Date(step.completedAt).toLocaleString('ro-RO')}
              </p>
            )}
          </div>
        </div>

        {/* Render children */}
        {step.children && step.children.length > 0 && (
          <div className="ml-4">
            {step.children.map((child) => renderStep(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-text-secondary">Se încarcă workflow-ul...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger">Eroare la încărcarea workflow-ului: {error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Workflow Document</h3>
      </CardHeader>
      <CardBody>
        {workflowTree.length === 0 ? (
          <p className="text-text-secondary">Nu există pași în workflow</p>
        ) : (
          <div className="space-y-4">
            {workflowTree.map((step) => renderStep(step, 0))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}








