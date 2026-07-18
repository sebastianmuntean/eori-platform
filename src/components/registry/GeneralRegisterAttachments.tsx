'use client';

import React, { useState, useEffect } from 'react';
import { useGeneralRegisterAttachments, GeneralRegisterAttachment } from '@/hooks/useGeneralRegisterAttachments';
import { useGeneralRegisterWorkflow } from '@/hooks/useGeneralRegister';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUsers } from '@/hooks/useUsers';

interface GeneralRegisterAttachmentsProps {
  documentId: string;
  onAttachmentsUpdate?: () => void;
}

/** Step shape for labels (id, action, toUserId). */
type StepForLabel = { id: string; action: string; toUserId: string | null };

export function GeneralRegisterAttachments({
  documentId,
  onAttachmentsUpdate,
}: GeneralRegisterAttachmentsProps) {
  const {
    attachments,
    loading,
    error,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useGeneralRegisterAttachments();

  const { workflowSteps, fetchWorkflow } = useGeneralRegisterWorkflow();
  const { users, fetchUsers } = useUsers();
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers({ pageSize: 1000 });
    fetchAttachments(documentId);
  }, [documentId, fetchUsers, fetchAttachments]);

  useEffect(() => {
    if (documentId) {
      fetchWorkflow(documentId);
    }
  }, [documentId, fetchWorkflow]);

  const stepsForLabel: StepForLabel[] = workflowSteps.map((s) => ({
    id: s.id,
    action: s.action,
    toUserId: s.toUserId,
  }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedWorkflowStep) {
      alert('Selectați un pas din workflow pentru a lega atașamentul.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Fișierul depășește limita de 10MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadAttachment({
        documentId,
        file,
        workflowStepId: selectedWorkflowStep,
      });
      if (result) {
        if (onAttachmentsUpdate) onAttachmentsUpdate();
        if (fileInput) fileInput.value = '';
        setSelectedWorkflowStep(null);
      }
    } catch (err) {
      console.error('Error uploading attachment:', err);
      alert('Eroare la încărcarea fișierului');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Sigur doriți să ștergeți acest atașament?')) return;

    try {
      await deleteAttachment(documentId, attachmentId);
      if (onAttachmentsUpdate) onAttachmentsUpdate();
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert('Eroare la ștergerea fișierului');
    }
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      await downloadAttachment(documentId, attachmentId);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Eroare la descărcarea fișierului');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return '📎';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('application/pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const globalAttachments = attachments.filter((att) => !att.workflowStepId);
  const attachmentsByStep = stepsForLabel.reduce((acc, step) => {
    const stepAttachments = attachments.filter((att) => att.workflowStepId === step.id);
    if (stepAttachments.length > 0) {
      acc[step.id] = stepAttachments;
    }
    return acc;
  }, {} as Record<string, GeneralRegisterAttachment[]>);

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || user?.email || 'Necunoscut';
  };

  const getStepLabel = (stepId: string) => {
    const step = stepsForLabel.find((s) => s.id === stepId);
    if (!step) return 'Pas necunoscut';
    const actionLabels: Record<string, string> = {
      sent: 'Trimis',
      forwarded: 'Forwardat',
      returned: 'Returnat',
      approved: 'Aprobat',
      rejected: 'Respins',
      cancelled: 'Anulat',
    };
    return `${actionLabels[step.action] || step.action} către ${step.toUserId ? getUserName(step.toUserId) : 'N/A'}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold">Atașamente (legate de pas)</h3>
          <div className="flex gap-2 flex-wrap items-center">
            {stepsForLabel.length > 0 ? (
              <>
                <select
                  value={selectedWorkflowStep || ''}
                  onChange={(e) => setSelectedWorkflowStep(e.target.value || null)}
                  className="px-3 py-1.5 border rounded-md text-sm bg-bg-primary text-text-primary"
                  aria-label="Selectați pasul workflow pentru atașament"
                >
                  <option value="">Selectați pasul...</option>
                  {stepsForLabel.map((step) => (
                    <option key={step.id} value={step.id}>
                      {getStepLabel(step.id)}
                    </option>
                  ))}
                </select>
                <input
                  ref={setFileInput}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload-general"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => document.getElementById('file-upload-general')?.click()}
                  isLoading={uploading}
                  disabled={!selectedWorkflowStep}
                  title={!selectedWorkflowStep ? 'Selectați mai întâi un pas' : undefined}
                >
                  Încarcă Fișier
                </Button>
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                Salvați documentul cu cel puțin un pas (ex. Redirecționare sau Aprobare/Respinge) pentru a putea încărca atașamente.
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="p-4 bg-danger/10 border border-danger rounded text-danger mb-4">
            {error}
          </div>
        )}

        {loading && !attachments.length ? (
          <p className="text-text-secondary">Se încarcă atașamentele...</p>
        ) : attachments.length === 0 ? (
          <p className="text-text-secondary">Nu există atașamente</p>
        ) : (
          <div className="space-y-6">
            {/* Legacy: attachments previously linked to document only (no step) */}
            {globalAttachments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Atașamente legate anterior de document (fără pas)</h4>
                <div className="space-y-2">
                  {globalAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.fileName}</p>
                          <p className="text-sm text-text-secondary">
                            {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('ro-RO')} • {getUserName(attachment.uploadedBy)}
                          </p>
                        </div>
                        {attachment.isSigned && (
                          <Badge variant="success">Semnat</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(attachment.id)}
                        >
                          Descarcă
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(attachment.id)}
                        >
                          Șterge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments grouped by workflow step */}
            {Object.entries(attachmentsByStep).map(([stepId, stepAttachments]) => (
              <div key={stepId}>
                <h4 className="font-medium mb-2">{getStepLabel(stepId)}</h4>
                <div className="space-y-2">
                  {stepAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.fileName}</p>
                          <p className="text-sm text-text-secondary">
                            {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('ro-RO')} • {getUserName(attachment.uploadedBy)}
                          </p>
                        </div>
                        {attachment.isSigned && (
                          <Badge variant="success">Semnat</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(attachment.id)}
                        >
                          Descarcă
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(attachment.id)}
                        >
                          Șterge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}








