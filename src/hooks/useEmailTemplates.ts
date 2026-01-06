'use client';

import { useState, useCallback } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  category: 'predefined' | 'custom';
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EmailTemplatesResponse {
  data: EmailTemplate[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseEmailTemplatesReturn {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchTemplates: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  getTemplate: (templateId: string) => Promise<EmailTemplate | null>;
  createTemplate: (templateData: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: 'predefined' | 'custom';
    isActive?: boolean;
  }) => Promise<boolean>;
  updateTemplate: (templateId: string, templateData: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    isActive?: boolean;
  }) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  sendTestEmail: (templateId: string, recipientEmail: string, recipientName: string, variables?: Record<string, any>) => Promise<boolean>;
  sendBulkEmail: (templateId: string, recipients: Array<{ email: string; name: string }>, variables?: Record<string, any>) => Promise<{ total: number; successful: number; failed: number; errors: Array<{ email: string; error: string }> } | null>;
}

export function useEmailTemplates(): UseEmailTemplatesReturn {
  console.log('Step 1: useEmailTemplates hook initialized');

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEmailTemplatesReturn['pagination']>(null);

  const fetchTemplates = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    console.log('Step 2: Fetching email templates with params:', params);
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.isActive) queryParams.append('isActive', params.isActive);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `/api/email-templates?${queryParams.toString()}`;
      console.log(`  Fetching from: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to fetch templates: ${data.error}`);
        throw new Error(data.error || 'Failed to fetch templates');
      }

      console.log(`✓ Fetched ${data.data.length} templates`);
      setTemplates(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      console.error(`❌ Error fetching templates: ${errorMessage}`);
      setError(errorMessage);
      setTemplates([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (templateId: string): Promise<EmailTemplate | null> => {
    console.log(`Step 1: Fetching template ${templateId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-templates/${templateId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to fetch template: ${data.error}`);
        throw new Error(data.error || 'Failed to fetch template');
      }

      console.log(`✓ Template fetched: ${data.data.name}`);
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch template';
      console.error(`❌ Error fetching template: ${errorMessage}`);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: 'predefined' | 'custom';
    isActive?: boolean;
  }): Promise<boolean> => {
    console.log('Step 1: Creating email template');
    console.log(`  Name: ${templateData.name}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to create template: ${data.error}`);
        throw new Error(data.error || 'Failed to create template');
      }

      console.log(`✓ Template created: ${data.data.id}`);
      // Refresh templates list
      await fetchTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      console.error(`❌ Error creating template: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (templateId: string, templateData: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    isActive?: boolean;
  }): Promise<boolean> => {
    console.log(`Step 1: Updating template ${templateId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to update template: ${data.error}`);
        throw new Error(data.error || 'Failed to update template');
      }

      console.log(`✓ Template updated: ${templateId}`);
      // Refresh templates list
      await fetchTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      console.error(`❌ Error updating template: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    console.log(`Step 1: Deleting template ${templateId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to delete template: ${data.error}`);
        throw new Error(data.error || 'Failed to delete template');
      }

      console.log(`✓ Template deleted: ${templateId}`);
      // Refresh templates list
      await fetchTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      console.error(`❌ Error deleting template: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const sendTestEmail = useCallback(async (
    templateId: string,
    recipientEmail: string,
    recipientName: string,
    variables: Record<string, any> = {}
  ): Promise<boolean> => {
    console.log(`Step 1: Sending test email for template ${templateId}`);
    console.log(`  Recipient: ${recipientEmail} (${recipientName})`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-templates/${templateId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          variables,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to send test email: ${data.error}`);
        throw new Error(data.error || 'Failed to send test email');
      }

      console.log(`✓ Test email sent successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      console.error(`❌ Error sending test email: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendBulkEmail = useCallback(async (
    templateId: string,
    recipients: Array<{ email: string; name: string }>,
    variables: Record<string, any> = {}
  ): Promise<{ total: number; successful: number; failed: number; errors: Array<{ email: string; error: string }> } | null> => {
    console.log(`Step 1: Sending bulk emails for template ${templateId}`);
    console.log(`  Recipients: ${recipients.length}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email-templates/${templateId}/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          variables,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to send bulk emails: ${data.error}`);
        throw new Error(data.error || 'Failed to send bulk emails');
      }

      console.log(`✓ Bulk emails sent: ${data.data.successful} successful, ${data.data.failed} failed`);
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send bulk emails';
      console.error(`❌ Error sending bulk emails: ${errorMessage}`);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    templates,
    loading,
    error,
    pagination,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendTestEmail,
    sendBulkEmail,
  };
}

