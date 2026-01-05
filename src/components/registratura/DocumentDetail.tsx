'use client';

import React from 'react';
import { Document } from '@/hooks/useDocuments';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getStatusInfo, getPriorityInfo, getDocumentTypeLabel } from '@/lib/registratura/status-utils';

interface DocumentDetailProps {
  document: Document;
  onEdit?: () => void;
  onDelete?: () => void;
  onRoute?: () => void;
  onResolve?: () => void;
}

export function DocumentDetail({ document, onEdit, onDelete, onRoute, onResolve }: DocumentDetailProps) {
  const getStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo(status);
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = getPriorityInfo(priority);
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  const isIncoming = document.documentType === 'incoming';
  const isOutgoing = document.documentType === 'outgoing';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {document.formattedNumber || 'Document Fără Număr'}
          </h2>
          <p className="text-text-secondary">{document.subject}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editează
            </Button>
          )}
          {onRoute && document.status !== 'resolved' && (
            <Button variant="primary" onClick={onRoute}>
              Trimite
            </Button>
          )}
          {onResolve && document.status !== 'resolved' && (
            <Button variant="success" onClick={onResolve}>
              Rezolvă
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Șterge
            </Button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Informații Generale</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary">Tip Document</label>
              <p className="mt-1">{getDocumentTypeLabel(document.documentType)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Status</label>
              <div className="mt-1">{getStatusBadge(document.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Prioritate</label>
              <div className="mt-1">{getPriorityBadge(document.priority)}</div>
            </div>
            {document.registrationDate && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Data Înregistrării</label>
                <p className="mt-1">{new Date(document.registrationDate).toLocaleDateString('ro-RO')}</p>
              </div>
            )}
            {document.externalNumber && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Număr Extern</label>
                <p className="mt-1">{document.externalNumber}</p>
              </div>
            )}
            {document.externalDate && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Data Externă</label>
                <p className="mt-1">{new Date(document.externalDate).toLocaleDateString('ro-RO')}</p>
              </div>
            )}
            {document.dueDate && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Termen Limita</label>
                <p className="mt-1">{new Date(document.dueDate).toLocaleDateString('ro-RO')}</p>
              </div>
            )}
            {document.resolvedDate && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Data Rezolvării</label>
                <p className="mt-1">{new Date(document.resolvedDate).toLocaleDateString('ro-RO')}</p>
              </div>
            )}
            {document.fileIndex && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Indicativ Arhivare</label>
                <p className="mt-1">{document.fileIndex}</p>
              </div>
            )}
            {document.isSecret && (
              <div>
                <label className="text-sm font-medium text-text-secondary">Document Secret</label>
                <p className="mt-1">
                  <Badge variant="danger">Secret</Badge>
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Sender/Recipient Info */}
      {(isIncoming || isOutgoing) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {isIncoming ? 'Expeditor' : 'Destinatar'}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isIncoming && document.senderName && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Nume Expeditor</label>
                  <p className="mt-1">{document.senderName}</p>
                </div>
              )}
              {isIncoming && document.senderDocNumber && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Nr. Document Expeditor</label>
                  <p className="mt-1">{document.senderDocNumber}</p>
                </div>
              )}
              {isIncoming && document.senderDocDate && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Data Document Expeditor</label>
                  <p className="mt-1">{new Date(document.senderDocDate).toLocaleDateString('ro-RO')}</p>
                </div>
              )}
              {isOutgoing && document.recipientName && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Nume Destinatar</label>
                  <p className="mt-1">{document.recipientName}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Content */}
      {document.content && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Conținut</h3>
          </CardHeader>
          <CardBody>
            <div className="whitespace-pre-wrap text-text-primary">{document.content}</div>
          </CardBody>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Metadate</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-sm font-medium text-text-secondary">Creat la</label>
              <p className="mt-1">{new Date(document.createdAt).toLocaleString('ro-RO')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Actualizat la</label>
              <p className="mt-1">{new Date(document.updatedAt).toLocaleString('ro-RO')}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


