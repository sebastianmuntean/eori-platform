'use client';

import { useState, useCallback } from 'react';

export type DocumentType = 'incoming' | 'outgoing' | 'internal';
export type DocumentStatus = 'draft' | 'registered' | 'in_work' | 'resolved' | 'archived';
export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Document {
  id: string;
  parishId: string;
  registrationNumber: number | null;
  registrationYear: number | null;
  formattedNumber: string | null;
  documentType: DocumentType;
  registrationDate: string | null;
  externalNumber: string | null;
  externalDate: string | null;
  senderClientId: string | null;
  senderName: string | null;
  senderDocNumber: string | null;
  senderDocDate: string | null;
  recipientClientId: string | null;
  recipientName: string | null;
  subject: string;
  content: string | null;
  priority: DocumentPriority;
  status: DocumentStatus;
  departmentId: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  resolvedDate: string | null;
  fileIndex: string | null;
  parentDocumentId: string | null;
  isSecret: boolean;
  secretDeclassificationList: string[] | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WorkflowRecord {
  id: string;
  documentId: string;
  fromUserId: string | null;
  toUserId: string | null;
  fromDepartmentId: string | null;
  toDepartmentId: string | null;
  action: 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected';
  resolution: string | null;
  notes: string | null;
  isExpired: boolean;
  createdAt: string;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDocuments: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    year?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createDocument: (data: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  cancelDocument: (id: string, notes?: string | null) => Promise<boolean>;
}

interface UseDocumentReturn {
  document: Document | null;
  loading: boolean;
  error: string | null;
  fetchDocument: (id: string) => Promise<void>;
  workflowHistory: WorkflowRecord[];
  fetchWorkflowHistory: (id: string) => Promise<void>;
}

interface UseCreateDocumentReturn {
  createDocument: (data: Partial<Document>) => Promise<Document | null>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateDocumentReturn {
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document | null>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteDocumentReturn {
  deleteDocument: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

interface UseRouteDocumentReturn {
  routeDocument: (params: {
    documentId: string;
    toUserId?: string | null;
    toDepartmentId?: string | null;
    action: 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected';
    resolution?: string | null;
    notes?: string | null;
  }) => Promise<{ document: Document; workflow: WorkflowRecord } | null>;
  loading: boolean;
  error: string | null;
}

interface UseResolveDocumentReturn {
  resolveDocument: (params: {
    documentId: string;
    resolutionStatus?: 'approved' | 'rejected';
    resolution?: string | null;
    notes?: string | null;
  }) => Promise<{ document: Document; workflow: WorkflowRecord } | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing a list of documents
 */
export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDocumentsReturn['pagination']>(null);

  const fetchDocuments = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    year?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('limit', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.documentType) queryParams.append('documentType', params.documentType);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/registratura/documents?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch documents');
      }

      setDocuments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (data: Partial<Document>): Promise<Document | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registratura/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create document');
      }

      setDocuments((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create document';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(
    async (id: string, data: Partial<Document>): Promise<Document | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/registratura/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to update document');
        }

        setDocuments((prev) => prev.map((doc) => (doc.id === id ? result.data : doc)));
        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelDocument = useCallback(async (id: string, notes?: string | null): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel document');
      }

      // Update document status in local state
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status: 'archived' as DocumentStatus } : doc)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel document';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    pagination,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    cancelDocument,
  };
}

/**
 * Hook for managing a single document
 */
export function useDocument(id?: string): UseDocumentReturn {
  const [document, setDocument] = useState<Document | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${documentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch document');
      }

      setDocument(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch document';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkflowHistory = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${documentId}/workflow`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workflow history');
      }

      setWorkflowHistory(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workflow history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    document,
    loading,
    error,
    workflowHistory,
    fetchDocument,
    fetchWorkflowHistory,
  };
}

/**
 * Hook for creating a document
 */
export function useCreateDocument(): UseCreateDocumentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDocument = useCallback(async (data: Partial<Document>): Promise<Document | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registratura/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create document');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create document';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createDocument,
    loading,
    error,
  };
}

/**
 * Hook for updating a document
 */
export function useUpdateDocument(): UseUpdateDocumentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocument = useCallback(
    async (id: string, data: Partial<Document>): Promise<Document | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/registratura/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to update document');
        }

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateDocument,
    loading,
    error,
  };
}

/**
 * Hook for deleting a document
 */
export function useDeleteDocument(): UseDeleteDocumentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registratura/documents/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteDocument,
    loading,
    error,
  };
}

/**
 * Hook for routing a document
 */
export function useRouteDocument(): UseRouteDocumentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeDocument = useCallback(
    async (params: {
      documentId: string;
      toUserId?: string | null;
      toDepartmentId?: string | null;
      action: 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected';
      resolution?: string | null;
      notes?: string | null;
    }): Promise<{ document: Document; workflow: WorkflowRecord } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/registratura/documents/${params.documentId}/workflow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: params.toUserId,
            toDepartmentId: params.toDepartmentId,
            action: params.action,
            resolution: params.resolution,
            notes: params.notes,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to route document');
        }

        return {
          document: result.data.document || result.data,
          workflow: result.data.workflow || result.data,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to route document';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    routeDocument,
    loading,
    error,
  };
}

/**
 * Hook for resolving a document
 */
export function useResolveDocument(): UseResolveDocumentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveDocument = useCallback(
    async (params: {
      documentId: string;
      resolutionStatus?: 'approved' | 'rejected';
      resolution?: string | null;
      notes?: string | null;
    }): Promise<{ document: Document; workflow: WorkflowRecord } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/registratura/documents/${params.documentId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolutionStatus: params.resolutionStatus,
            resolution: params.resolution,
            notes: params.notes,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to resolve document');
        }

        return {
          document: result.data,
          workflow: result.workflow,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to resolve document';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    resolveDocument,
    loading,
    error,
  };
}
