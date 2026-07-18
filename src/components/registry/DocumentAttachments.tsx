'use client';

import React, { useState, useEffect } from 'react';
import { useDocumentAttachments, DocumentAttachment } from '@/hooks/useDocumentAttachments';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DocumentAttachmentsProps {
  documentId: string;
  onAttachmentsUpdate?: () => void;
}

export function DocumentAttachments({ documentId, onAttachmentsUpdate }: DocumentAttachmentsProps) {
  const {
    attachments,
    loading,
    error,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useDocumentAttachments();

  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    if (documentId) {
      fetchAttachments(documentId);
    }
  }, [documentId, fetchAttachments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Fișierul depășește limita de 10MB');
      return;
    }

    // Validate documentId
    if (!documentId) {
      alert('ID-ul documentului lipsește');
      return;
    }

    setUploading(true);
    try {
      await uploadAttachment({ documentId, file });
      if (onAttachmentsUpdate) onAttachmentsUpdate();
      if (fileInput) fileInput.value = '';
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
      await deleteAttachment(attachmentId);
      if (onAttachmentsUpdate) onAttachmentsUpdate();
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert('Eroare la ștergerea fișierului');
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      await downloadAttachment(attachmentId);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Eroare la descărcarea fișierului');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Atașamente</h3>
          <div>
            <input
              ref={setFileInput}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              isLoading={uploading}
            >
              Încarcă Fișier
            </Button>
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
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.fileName}</p>
                    <p className="text-sm text-text-secondary">
                      {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('ro-RO')}
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
                    onClick={() => handleDownload(attachment.id, attachment.fileName)}
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
        )}
      </CardBody>
    </Card>
  );
}

