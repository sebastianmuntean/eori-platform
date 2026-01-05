'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { EmailTemplateForm } from '@/components/email-templates/EmailTemplateForm';
import { EmailTemplatePreview } from '@/components/email-templates/EmailTemplatePreview';
import { TemplateTestDialog } from '@/components/email-templates/TemplateTestDialog';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

type TemplateRow = EmailTemplate & {
  [key: string]: any;
};

export default function SuperadminEmailTemplatesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_VIEW);
  console.log('Step 1: Rendering Email Templates superadmin page');

  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('emailTemplates') || t('emailTemplates'));

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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTemplateName, setCopyTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch templates on mount and when filters change
  useEffect(() => {
    console.log('Step 2: Fetching templates with filters');
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
    console.log('Step 3: Handling search:', value);
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
    console.log('Step 4: Creating template');
    setFormErrors(null);
    const success = await createTemplate(data);
    if (success) {
      console.log('✓ Template created successfully');
      setShowAddModal(false);
    } else {
      console.log('❌ Failed to create template');
      setFormErrors(t('templateNotCreated'));
    }
  };

  const handleCopy = async () => {
    if (!selectedTemplate || !copyTemplateName.trim()) {
      setFormErrors(t('templateNameRequired'));
      return;
    }

    setFormErrors(null);
    const success = await createTemplate({
      name: copyTemplateName.trim(),
      subject: selectedTemplate.subject,
      htmlContent: selectedTemplate.htmlContent,
      textContent: selectedTemplate.textContent || undefined,
      category: 'custom',
      isActive: selectedTemplate.isActive,
    });

    if (success) {
      setShowCopyModal(false);
      setCopyTemplateName('');
      setSelectedTemplate(null);
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
    console.log(`Step 5: Updating template ${selectedTemplate.id}`);
    setFormErrors(null);
    const success = await updateTemplate(selectedTemplate.id, data);
    if (success) {
      console.log('✓ Template updated successfully');
      setShowEditModal(false);
      setSelectedTemplate(null);
    } else {
      console.log('❌ Failed to update template');
      setFormErrors(t('templateNotUpdated'));
    }
  };

  const handleDelete = async (templateId: string) => {
    console.log(`Step 6: Deleting template ${templateId}`);
    const success = await deleteTemplate(templateId);
    if (success) {
      console.log(`✓ Template deleted: ${templateId}`);
      setDeleteConfirm(null);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    console.log(`Step 7: Previewing template ${template.id}`);
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleTest = (template: EmailTemplate) => {
    console.log(`Step 8: Testing template ${template.id}`);
    setSelectedTemplate(template);
    setShowTestModal(true);
  };

  const handleSendTest = async (recipientEmail: string, recipientName: string, variables: Record<string, any>) => {
    if (!selectedTemplate) return;
    console.log(`Step 9: Sending test email for template ${selectedTemplate.id}`);
    const success = await sendTestEmail(selectedTemplate.id, recipientEmail, recipientName, variables);
    if (success) {
      console.log('✓ Test email sent successfully');
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
              <Badge key={varName} variant="outline" size="sm">
                {varName}
              </Badge>
            ))
          ) : (
            <span className="text-text-secondary text-xs">Fără variabile</span>
          )}
          {value && value.length > 3 && (
            <Badge variant="outline" size="sm">
              +{value.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt' as keyof TemplateRow,
      label: 'Actualizat',
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(row as EmailTemplate);
              setCopyTemplateName(`${row.name} - Copie`);
              setShowCopyModal(true);
            }}
          >
            {t('copyTemplate')}
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

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('breadcrumbSuperadmin'), href: `/${locale}/dashboard/superadmin` },
    { label: t('emailTemplates') },
  ];

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  console.log('✓ Rendering page');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('manageEmailTemplates')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          + {t('addTemplate')}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t('searchByNameOrSubject')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('allCategories')}</option>
              <option value="predefined">{t('predefined')}</option>
              <option value="custom">{t('custom')}</option>
            </select>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="true">{t('active')}</option>
              <option value="false">{t('inactive')}</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-text-secondary">{t('loading')}</div>
          ) : (
            <>
              <Table
                data={templates}
                columns={columns}
                emptyMessage={t('noTemplates')}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-text-secondary">
                    {t('pageOf')} {pagination.page} {t('ofTotal')} {pagination.totalPages} ({pagination.total} {t('total')})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Template Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormErrors(null);
        }}
        title={t('addEmailTemplate')}
        size="full"
      >
        {formErrors && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
            {formErrors}
          </div>
        )}
        <EmailTemplateForm
          onSubmit={handleCreate}
          onCancel={() => {
            setShowAddModal(false);
            setFormErrors(null);
          }}
          isLoading={loading}
        />
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
          setFormErrors(null);
        }}
        title={t('editTemplate')}
        size="full"
      >
        {formErrors && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
            {formErrors}
          </div>
        )}
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
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate ? `${t('preview')} - ${selectedTemplate.name}` : t('previewTemplate')}
        size="xl"
      >
        {selectedTemplate && (
          <EmailTemplatePreview
            template={selectedTemplate}
            onSendTest={handleSendTest}
          />
        )}
      </Modal>

      {/* Copy Template Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setCopyTemplateName('');
          setSelectedTemplate(null);
          setFormErrors(null);
        }}
        title={t('copyTemplate')}
        size="md"
      >
        <div className="space-y-4">
          {formErrors && (
            <div className="p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
              {formErrors}
            </div>
          )}
          <div>
            <Input
              label={t('templateName')}
              value={copyTemplateName}
              onChange={(e) => setCopyTemplateName(e.target.value)}
              placeholder={t('enterTemplateName')}
              required
            />
            {selectedTemplate && (
              <p className="text-sm text-text-secondary mt-2">
                {t('copyingTemplate')}: {selectedTemplate.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowCopyModal(false);
                setCopyTemplateName('');
                setSelectedTemplate(null);
                setFormErrors(null);
              }}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleCopy} isLoading={loading} disabled={!copyTemplateName.trim()}>
              {t('copyTemplate')}
            </Button>
          </div>
        </div>
      </Modal>

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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <p className="mb-4 text-text-primary">
          Ești sigur că vrei să ștergi acest șablon? Această acțiune nu poate fi anulată.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

