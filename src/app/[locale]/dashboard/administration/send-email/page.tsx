'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { SendEmailDialog } from '@/components/email-templates/SendEmailDialog';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslations } from 'next-intl';

export default function SendEmailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('sendEmail') || 'Send Email');

  // Check permission to send emails
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_SEND);

  const {
    templates,
    loading,
    error,
    fetchTemplates,
    sendBulkEmail,
  } = useEmailTemplates();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendResult, setSendResult] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);

  // Fetch only active templates (all hooks must be called before any conditional returns)
  useEffect(() => {
    if (permissionLoading) return;
    fetchTemplates({
      page: 1,
      pageSize: 100,
      isActive: 'true',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [permissionLoading, fetchTemplates]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowSendDialog(true);
    setSendResult(null);
  };

  const handleSend = async (
    recipients: Array<{ email: string; name: string }>,
    variables: Record<string, any>
  ): Promise<{ total: number; successful: number; failed: number; errors: Array<{ email: string; error: string }> } | null> => {
    if (!selectedTemplate) return null;

    const result = await sendBulkEmail(selectedTemplate.id, recipients, variables);
    
    if (result) {
      setSendResult(result);
      return result;
    }
    return null;
  };

  // Filter templates by search term
  const filteredTemplates = templates.filter((template) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(search) ||
      template.subject.toLowerCase().includes(search) ||
      template.category.toLowerCase().includes(search)
    );
  });

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration') || 'Administration', href: `/${locale}/dashboard/administration` },
          { label: tMenu('sendEmail') || 'Send Email' },
        ]}
        title={tMenu('sendEmail') || 'Send Email'}
      />

      {/* Search */}
      <Card>
        <CardBody>
          <div className="mb-4">
            <Input
              placeholder="Caută șablon după nume sau subiect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
              {error}
            </div>
          )}

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Se încarcă...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              {searchTerm ? 'Nu s-au găsit șabloane care să corespundă căutării.' : 'Nu există șabloane active disponibile.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {template.subject}
                        </p>
                      </div>
                      {template.category === 'predefined' && (
                        <Badge variant="info" size="sm">
                          Predefinit
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {template.variables.length > 0 && (
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Variabile:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((varName) => (
                              <Badge key={varName} variant="secondary" size="sm">
                                {varName}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="secondary" size="sm">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full"
                        disabled={loading}
                      >
                        Trimite cu acest șablon
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Send Result - Displayed on page after dialog closes */}
      {sendResult && !showSendDialog && (
        <Card className={sendResult.failed === 0 ? 'border-success border-2' : sendResult.successful > 0 ? 'border-warning border-2' : 'border-danger border-2'}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {sendResult.failed === 0 ? (
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : sendResult.successful > 0 ? (
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <h2 className="text-lg font-semibold text-text-primary">
                {sendResult.failed === 0 
                  ? '✓ Toate email-urile au fost trimise cu succes!' 
                  : sendResult.successful > 0 
                  ? '⚠ Trimitere parțial reușită' 
                  : '❌ Trimitere eșuată'}
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">{sendResult.total}</div>
                  <div className="text-xs text-text-secondary mt-1">Total trimise</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">{sendResult.successful}</div>
                  <div className="text-xs text-text-secondary mt-1">Succes</div>
                </div>
                <div className="text-center p-3 bg-danger/10 rounded-lg">
                  <div className="text-2xl font-bold text-danger">{sendResult.failed}</div>
                  <div className="text-xs text-text-secondary mt-1">Eșuate</div>
                </div>
              </div>
              
              {sendResult.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-text-primary hover:text-primary">
                      Vezi detaliile erorilor ({sendResult.errors.length})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {sendResult.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-danger p-3 bg-danger/10 rounded-lg border border-danger/20">
                          <div className="font-semibold mb-1">{error.email}</div>
                          <div>{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSendResult(null)}
                >
                  Șterge rezultatele
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Send Email Dialog */}
      {selectedTemplate && (
        <SendEmailDialog
          isOpen={showSendDialog}
          onClose={() => {
            setShowSendDialog(false);
            setSelectedTemplate(null);
            setSendResult(null);
          }}
          template={selectedTemplate}
          onSend={handleSend}
        />
      )}
    </PageContainer>
  );
}

