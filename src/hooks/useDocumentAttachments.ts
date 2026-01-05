'use client';

import { useState, useCallback } from 'react';

export interface DocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  storageName: string;
  storagePath: string;
  mimeType: string | null;
  fileSize: number | null;
  version: number | null;
  isSigned: boolean;
  signedBy: string | null;
  signedAt: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface UseDocumentAttachmentsReturn {
  attachments: DocumentAttachment[];
  loading: boolean;
  error: string | null;
  fetchAttachments: (documentId: string) => Promise<void>;
  uploadAttachment: (params: {
    documentId: string;
    file: File;
  }) => Promise<DocumentAttachment | null>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;
  downloadAttachment: (attachmentId: string) => Promise<void>;
}

interface UseUploadAttachmentReturn {
  uploadAttachment: (params: {
    documentId: string;
    file: File;
  }) => Promise<DocumentAttachment | null>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteAttachmentReturn {
  deleteAttachment: (documentId: string, attachmentId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing document attachments
 */
export function useDocumentAttachments(
  documentId?: string
): UseDocumentAttachmentsReturn {
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = useCallback(async (docId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${docId}/attachments`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch attachments');
      }

      setAttachments(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attachments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAttachment = useCallback(
    async (params: { documentId: string; file: File }): Promise<DocumentAttachment | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', params.file);

        const response = await fetch(
          `/api/registratura/documents/${params.documentId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload attachment');
        }

        setAttachments((prev) => [...prev, result.data]);
        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload attachment';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Find the attachment to get documentId
      const attachment = attachments.find((att) => att.id === attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      const response = await fetch(
        `/api/registratura/documents/${attachment.documentId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete attachment');
      }

      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete attachment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [attachments]);

  const downloadAttachment = useCallback(async (attachmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Find the attachment to get documentId
      const attachment = attachments.find((att) => att.id === attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      const response = await fetch(
        `/api/registratura/documents/${attachment.documentId}/attachments/${attachmentId}/download`
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to download attachment');
      }

      // Get filename from Content-Disposition header or use original filename
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || attachment.fileName
        : attachment.fileName;

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download attachment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attachments]);

  return {
    attachments,
    loading,
    error,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  };
}

/**
 * Hook for uploading a single attachment
 */
export function useUploadAttachment(): UseUploadAttachmentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAttachment = useCallback(
    async (params: { documentId: string; file: File }): Promise<DocumentAttachment | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', params.file);

        const response = await fetch(
          `/api/registratura/documents/${params.documentId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload attachment');
        }

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload attachment';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    uploadAttachment,
    loading,
    error,
  };
}

/**
 * Hook for deleting a single attachment
 */
export function useDeleteAttachment(): UseDeleteAttachmentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAttachment = useCallback(
    async (documentId: string, attachmentId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/registratura/documents/${documentId}/attachments/${attachmentId}`,
          {
            method: 'DELETE',
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete attachment');
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete attachment';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    deleteAttachment,
    loading,
    error,
  };
}
