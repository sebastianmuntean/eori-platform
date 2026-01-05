'use client';

import { useState, useCallback } from 'react';

export type DocumentType = 'program' | 'information' | 'contract' | 'insurance' | 'visa_info' | 'other';

export interface PilgrimageDocument {
  id: string;
  pilgrimageId: string;
  documentType: DocumentType;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  isPublic: boolean;
  uploadedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UsePilgrimageDocumentsReturn {
  documents: PilgrimageDocument[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (pilgrimageId: string) => Promise<void>;
  uploadDocument: (pilgrimageId: string, file: File, metadata: {
    documentType: DocumentType;
    title: string;
    isPublic?: boolean;
  }) => Promise<PilgrimageDocument | null>;
  deleteDocument: (pilgrimageId: string, documentId: string) => Promise<boolean>;
  downloadDocument: (pilgrimageId: string, documentId: string) => Promise<void>;
}

export function usePilgrimageDocuments(): UsePilgrimageDocumentsReturn {
  const [documents, setDocuments] = useState<PilgrimageDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (pilgrimageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/documents`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch documents');
      }

      setDocuments(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    pilgrimageId: string,
    file: File,
    metadata: {
      documentType: DocumentType;
      title: string;
      isPublic?: boolean;
    }
  ): Promise<PilgrimageDocument | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', metadata.documentType);
      formData.append('title', metadata.title);
      formData.append('isPublic', (metadata.isPublic || false).toString());

      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document');
      }

      setDocuments((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (
    pilgrimageId: string,
    documentId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async (
    pilgrimageId: string,
    documentId: string
  ) => {
    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/documents/${documentId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or use documentId
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `document-${documentId}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document';
      setError(errorMessage);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
  };
}



