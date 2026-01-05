'use client';

import { useState, useCallback } from 'react';

export type GeneralRegisterDocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
export type GeneralRegisterDocumentType = 'incoming' | 'outgoing' | 'internal';

export interface GeneralRegisterDocument {
  id: string;
  registerConfigurationId: string;
  parishId: string | null;
  documentNumber: number;
  year: number;
  documentType: GeneralRegisterDocumentType;
  date: string;
  subject: string;
  from: string | null;
  petitionerClientId?: string | null;
  to: string | null;
  description: string | null;
  filePath: string | null;
  status: GeneralRegisterDocumentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface GeneralRegisterWorkflowStep {
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
}

interface UseGeneralRegisterWorkflowReturn {
  workflowSteps: GeneralRegisterWorkflowStep[];
  workflowTree: any[];
  loading: boolean;
  error: string | null;
  fetchWorkflow: (documentId: string) => Promise<void>;
  forwardDocument: (documentId: string, data: {
    parentStepId?: string | null;
    toUserId: string;
    action: 'sent' | 'forwarded' | 'returned';
    notes?: string | null;
  }) => Promise<boolean>;
  resolveDocument: (documentId: string, data: {
    resolutionStatus: 'approved' | 'rejected';
    resolution?: string | null;
    notes?: string | null;
    workflowStepId?: string | null;
  }) => Promise<boolean>;
  cancelDocument: (documentId: string, data: {
    cancelAll?: boolean;
    notes?: string | null;
  }) => Promise<boolean>;
}

/**
 * Hook for general register workflow operations
 */
export function useGeneralRegisterWorkflow(): UseGeneralRegisterWorkflowReturn {
  const [workflowSteps, setWorkflowSteps] = useState<GeneralRegisterWorkflowStep[]>([]);
  const [workflowTree, setWorkflowTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/general-register/${documentId}/workflow`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle 404 (document not found) gracefully - this is expected for documents
        // that don't exist in general_register or don't have workflows yet
        if (response.status === 404) {
          setWorkflowSteps([]);
          setWorkflowTree([]);
          setError(null); // Don't set error for 404, it's not a real error
          return;
        }
        // For other errors, set error state but don't throw
        setError(data.error || 'Failed to fetch workflow');
        setWorkflowSteps([]);
        setWorkflowTree([]);
        return;
      }

      if (data.success) {
        setWorkflowSteps(data.data.steps || []);
        setWorkflowTree(data.data.tree || []);
      }
    } catch (err) {
      // Only log unexpected errors, not expected 404s
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workflow';
      setError(errorMessage);
      setWorkflowSteps([]);
      setWorkflowTree([]);
      // Only log to console if it's not a network error that might be expected
      if (!(err instanceof TypeError && err.message.includes('fetch'))) {
        console.error('Error fetching workflow:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const forwardDocument = useCallback(async (documentId: string, data: {
    parentStepId?: string | null;
    toUserId: string;
    action: 'sent' | 'forwarded' | 'returned';
    notes?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/general-register/${documentId}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to forward document');
      }

      if (result.success) {
        // Refresh workflow
        await fetchWorkflow(documentId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forward document';
      setError(errorMessage);
      console.error('Error forwarding document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflow]);

  const resolveDocument = useCallback(async (documentId: string, data: {
    resolutionStatus: 'approved' | 'rejected';
    resolution?: string | null;
    notes?: string | null;
    workflowStepId?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/general-register/${documentId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resolve document');
      }

      if (result.success) {
        // Refresh workflow
        await fetchWorkflow(documentId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve document';
      setError(errorMessage);
      console.error('Error resolving document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflow]);

  const cancelDocument = useCallback(async (documentId: string, data: {
    cancelAll?: boolean;
    notes?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registratura/general-register/${documentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel document');
      }

      if (result.success) {
        // Refresh workflow
        await fetchWorkflow(documentId);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel document';
      setError(errorMessage);
      console.error('Error cancelling document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflow]);

  return {
    workflowSteps,
    workflowTree,
    loading,
    error,
    fetchWorkflow,
    forwardDocument,
    resolveDocument,
    cancelDocument,
  };
}

/**
 * Create a new general register document
 */
export async function createGeneralRegisterDocument(data: {
  registerConfigurationId: string;
  documentType: 'incoming' | 'outgoing' | 'internal';
  subject: string;
  from?: string | null;
  to?: string | null;
  description?: string | null;
  filePath?: string | null;
  status?: 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
}): Promise<GeneralRegisterDocument | null> {
  console.log('[createGeneralRegisterDocument] Called with data:', {
    ...data,
    petitionerClientId: (data as any).petitionerClientId || 'null',
  });
  
  try {
    console.log('[createGeneralRegisterDocument] Sending POST request to /api/registratura/general-register');
    const response = await fetch('/api/registratura/general-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('[createGeneralRegisterDocument] Response status:', response.status, response.ok);
    const result = await response.json();
    console.log('[createGeneralRegisterDocument] Response data:', result);
    
    if (!response.ok) {
      console.error('[createGeneralRegisterDocument] Response not OK:', result);
      throw new Error(result.error || 'Failed to create document');
    }

    if (result.success) {
      console.log('[createGeneralRegisterDocument] Success! Document ID:', result.data?.id);
      return result.data;
    }
    
    console.warn('[createGeneralRegisterDocument] result.success is false, returning null');
    return null;
  } catch (err) {
    console.error('[createGeneralRegisterDocument] Error creating general register document:', err);
    throw err;
  }
}

/**
 * Get a general register document by ID
 */
export async function getGeneralRegisterDocument(id: string): Promise<GeneralRegisterDocument | null> {
  try {
    const response = await fetch(`/api/registratura/general-register/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch document');
    }

    if (result.success) {
      return result.data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching general register document:', err);
    throw err;
  }
}

/**
 * Check if user can resolve a general register document
 * Note: Permission checking is handled server-side via the API
 */
export async function canResolveGeneralRegisterDocument(documentId: string): Promise<boolean> {
  try {
    // Check via API - the server handles permission validation
    const response = await fetch(`/api/registratura/general-register/${documentId}/workflow`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // The API response indicates if the user has permission to resolve
    // This is a simplified check - the actual permission check happens on the server
    return data.success === true;
  } catch {
    return false;
  }
}

