'use client';

import { useState, useCallback } from 'react';

export interface GeneralRegisterAttachment {
  id: string;
  documentId: string;
  workflowStepId: string | null;
  fileName: string;
  storageName: string;
  storagePath: string;
  mimeType: string | null;
  fileSize: number;
  version: number;
  isSigned: boolean;
  signedBy: string | null;
  signedAt: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface UseGeneralRegisterAttachmentsReturn {
  attachments: GeneralRegisterAttachment[];
  loading: boolean;
  error: string | null;
  fetchAttachments: (documentId: string, workflowStepId?: string | null) => Promise<void>;
  uploadAttachment: (params: {
    documentId: string;
    file: File;
    workflowStepId?: string | null;
  }) => Promise<GeneralRegisterAttachment | null>;
  deleteAttachment: (documentId: string, attachmentId: string) => Promise<boolean>;
  downloadAttachment: (documentId: string, attachmentId: string) => Promise<void>;
}

/**
 * Hook for managing general register document attachments
 */
export function useGeneralRegisterAttachments(): UseGeneralRegisterAttachmentsReturn {
  const [attachments, setAttachments] = useState<GeneralRegisterAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = useCallback(async (documentId: string, workflowStepId?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const url = workflowStepId
        ? `/api/registratura/general-register/${documentId}/attachments?workflowStepId=${workflowStepId}`
        : `/api/registratura/general-register/${documentId}/attachments`;
      
      const response = await fetch(url);
      
      // Handle 404 (document not found) gracefully - this is expected for documents
      // that don't exist in general_register or don't have attachments yet
      if (response.status === 404) {
        setAttachments([]);
        setError(null); // Don't set error for 404, it's not a real error
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        // For other errors, set error state but don't throw
        setError(result.error || 'Failed to fetch attachments');
        setAttachments([]);
        return;
      }

      setAttachments(result.data || []);
    } catch (err) {
      // Only log unexpected errors, not expected network errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attachments';
      setError(errorMessage);
      setAttachments([]);
      // Only log to console if it's not a network error that might be expected
      if (!(err instanceof TypeError && err.message.includes('fetch'))) {
        console.error('Error fetching attachments:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAttachment = useCallback(
    async (params: {
      documentId: string;
      file: File;
      workflowStepId?: string | null;
    }): Promise<GeneralRegisterAttachment | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', params.file);
        if (params.workflowStepId) {
          formData.append('workflowStepId', params.workflowStepId);
        }

        const response = await fetch(
          `/api/registratura/general-register/${params.documentId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        // Handle 404 (document not found) gracefully
        if (response.status === 404) {
          const errorMessage = 'Documentul nu există în registrul general. Nu se pot încărca atașamente.';
          setError(errorMessage);
          return null;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMessage = result.error || 'Failed to upload attachment';
          setError(errorMessage);
          return null;
        }

        setAttachments((prev) => [...prev, result.data]);
        return result.data;
      } catch (err) {
        // Only log unexpected errors, not expected network errors
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload attachment';
        setError(errorMessage);
        // Only log to console if it's not a network error that might be expected
        if (!(err instanceof TypeError && err.message.includes('fetch'))) {
          console.error('Error uploading attachment:', err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAttachment = useCallback(async (documentId: string, attachmentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/registratura/general-register/${documentId}/attachments/${attachmentId}`,
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
  }, []);

  const downloadAttachment = useCallback(async (documentId: string, attachmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/registratura/general-register/${documentId}/attachments/${attachmentId}/download`
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to download attachment');
      }

      // Find attachment to get filename
      const attachment = attachments.find((att) => att.id === attachmentId);
      const fileName = attachment?.fileName || 'download';

      // Get filename from Content-Disposition header or use original filename
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? decodeURIComponent(contentDisposition.split('filename=')[1]?.replace(/"/g, '') || fileName)
        : fileName;

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

