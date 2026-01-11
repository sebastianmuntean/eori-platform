'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FormModal } from '@/components/accounting/FormModal';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { EmailTemplateForm } from '@/components/email-templates/EmailTemplateForm';
import { EmailTemplatePreview } from '@/components/email-templates/EmailTemplatePreview';
import { TemplateTestDialog } from '@/components/email-templates/TemplateTestDialog';
import { EmailTemplatesFiltersCard } from '@/components/administration/EmailTemplatesFiltersCard';
import { EmailTemplatesTableCard } from '@/components/administration/EmailTemplatesTableCard';
import { DeleteEmailTemplateDialog } from '@/components/administration/DeleteEmailTemplateDialog';
import { useTranslations } from 'next-intl';

type TemplateRow = EmailTemplate & {
  [key: string]: any;
};

interface EmailTemplatesPageContentProps {
  locale: string;
}

/**
 * Email Templates page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function EmailTemplatesPageContent({ locale }: EmailTemplatesPageContentProps) {
  const t = useTranslations('common');

  const {
    templates,
    loading,
    error,
    pagination,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendTestEmail,
  } = useEmailTemplates();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch templates on mount and when filters change
  useEffect(() => {
    fetchTemplates({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      category: categoryFilter || undefined,
      isActive: isActiveFilter || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, categoryFilter, isActiveFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = async (data: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: 'predefined' | 'custom';
    isActive?: boolean;
  }) => {
    setFormErrors(null);
    const success = await createTemplate(data);
    if (success) {
      setShowAddModal(false);
    } else {
      setFormErrors(t('templateNotCreated'));
    }
  };

  const handleUpdate = async (data: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    isActive?: boolean;
  }) => {
    if (!selectedTemplate) return;
    setFormErrors(null);
    const success = await updateTemplate(selectedTemplate.id, data);
    if (success) {
      setShowEditModal(false);
      setSelectedTemplate(null);
    } else {
      setFormErrors(t('templateNotUpdated'));
    }
  };

  const handleDelete = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTestModal(true);
  };

  const handleSendTest = async (recipientEmail: string, recipientName: string, variables: Record<string, any>) => {
    if (!selectedTemplate) return;
    const success = await sendTestEmail(selectedTemplate.id, recipientEmail, recipientName, variables);
    if (success) {
      setShowTestModal(false);
      setSelectedTemplate(null);
    }
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const columns = [
    {
      key: 'name' as keyof TemplateRow,
      label: t('name'),
      sortable: true,
      render: (value: any, row: TemplateRow) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">{value}</span>
          {row.category === 'predefined' && (
            <Badge variant="info" size="sm">
              {t('predefined')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'subject' as keyof TemplateRow,
      label: t('emailSubject'),
      sortable: false,
      render: (value: any) => (
        <span className="text-text-primary">{value}</span>
      ),
    },
    {
      key: 'category' as keyof TemplateRow,
      label: t('category'),
      sortable: false,
      render: (value: any) => (
        <Badge variant={value === 'predefined' ? 'info' : 'secondary'} size="sm">
          {value === 'predefined' ? t('predefined') : t('custom')}
        </Badge>
      ),
    },
    {
      key: 'isActive' as keyof TemplateRow,
      label: t('status'),
      sortable: false,
      render: (value: any) => (
        <Badge variant={value ? 'success' : 'warning'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'variables' as keyof TemplateRow,
      label: t('templateVariables'),
      sortable: false,
      render: (value: any) => (
        <div className="flex flex-wrap gap-1">
          {value && value.length > 0 ? (
            value.slice(0, 3).map((varName: string) => (
              <Badge key={varName} variant="secondary" size="sm">
                {varName}
              </Badge>
            ))
          ) : (
            <span className="text-text-secondary text-xs">{t('noVariables') || 'Fără variabile'}</span>
          )}
          {value && value.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{value.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt' as keyof TemplateRow,
      label: t('updated') || 'Actualizat',
      sortable: true,
      render: (value: any) => (
        <span className="text-text-secondary text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: 'id' as keyof TemplateRow,
      label: t('actions'),
      sortable: false,
      render: (value: any, row: TemplateRow) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview(row as EmailTemplate)}
          >
            {t('preview')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTest(row as EmailTemplate)}
          >
            {t('test')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(row as EmailTemplate);
              setShowEditModal(true);
            }}
          >
            {t('editTemplate')}
          </Button>
          {row.category === 'custom' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirm(row.id)}
            >
              {t('deleteTemplate')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration') || 'Administration', href: `/${locale}/dashboard/administration` },
          { label: t('emailTemplatesBreadcrumb') || t('manageEmailTemplates') || 'Email Templates' },
        ]}
        title={t('manageEmailTemplates') || 'Email Templates'}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            + {t('addTemplate')}
          </Button>
        }
      />

      {/* Filters */}
      <EmailTemplatesFiltersCard
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        isActiveFilter={isActiveFilter}
        onSearchChange={handleSearch}
        onCategoryFilterChange={(value) => {
          setCategoryFilter(value);
          setCurrentPage(1);
        }}
        onIsActiveFilterChange={(value) => {
          setIsActiveFilter(value);
          setCurrentPage(1);
        }}
      />

      {/* Table */}
      <EmailTemplatesTableCard
        data={templates}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noTemplates')}
      />

      {/* Add Template Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormErrors(null);
        }}
        onCancel={() => {
          setShowAddModal(false);
          setFormErrors(null);
        }}
        title={t('addEmailTemplate')}
        onSubmit={() => {}}
        isSubmitting={loading}
        submitLabel={t('save')}
        cancelLabel={t('cancel')}
        error={formErrors || undefined}
        size="full"
      >
        <EmailTemplateForm
          onSubmit={handleCreate}
          onCancel={() => {
            setShowAddModal(false);
            setFormErrors(null);
          }}
          isLoading={loading}
        />
      </FormModal>

      {/* Edit Template Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
          setFormErrors(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
          setFormErrors(null);
        }}
        title={t('editTemplate')}
        onSubmit={() => {}}
        isSubmitting={loading}
        submitLabel={t('save')}
        cancelLabel={t('cancel')}
        error={formErrors || undefined}
        size="full"
      >
        {selectedTemplate && (
          <EmailTemplateForm
            template={selectedTemplate}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedTemplate(null);
              setFormErrors(null);
            }}
            isLoading={loading}
          />
        )}
      </FormModal>

      {/* Preview Modal */}
      <SimpleModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate ? `${t('preview')} - ${selectedTemplate.name}` : t('previewTemplate')}
        size="full"
      >
        {selectedTemplate && (
          <EmailTemplatePreview
            template={selectedTemplate}
            onSendTest={handleSendTest}
          />
        )}
      </SimpleModal>

      {/* Test Email Modal */}
      {selectedTemplate && (
        <TemplateTestDialog
          isOpen={showTestModal}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSend={handleSendTest}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteEmailTemplateDialog
        isOpen={!!deleteConfirm}
        templateId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

