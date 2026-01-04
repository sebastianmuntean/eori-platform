'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VariableHelper } from './VariableHelper';
import { HtmlEditor } from './HtmlEditor';
import { EmailTemplate } from '@/hooks/useEmailTemplates';
import { extractTemplateVariables } from '@/lib/utils/email';
import { useTranslations } from 'next-intl';

interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  onSubmit: (data: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: 'predefined' | 'custom';
    isActive?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmailTemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
}: EmailTemplateFormProps) {
  const t = useTranslations('common');
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent || '');
  const [textContent, setTextContent] = useState(template?.textContent || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setHtmlContent(template.htmlContent);
      setTextContent(template.textContent || '');
      setIsActive(template.isActive);
    }
  }, [template]);

  useEffect(() => {
    const variables = extractTemplateVariables(htmlContent + textContent);
    setDetectedVariables(variables);
  }, [htmlContent, textContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Step 3: Form submission');

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('nameRequired');
    if (!subject.trim()) newErrors.subject = t('subjectRequired');
    if (!htmlContent.trim()) newErrors.htmlContent = t('htmlContentRequired');

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      name: name.trim(),
      subject: subject.trim(),
      htmlContent: htmlContent.trim(),
      textContent: textContent.trim() || undefined,
      category: template?.category || 'custom',
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(98vh-200px)] overflow-y-auto">
      <div>
        <Input
          label={t('templateName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="ex: Email de confirmare cont"
          disabled={isLoading || template?.category === 'predefined'}
        />
        {template?.category === 'predefined' && (
          <p className="text-xs text-text-secondary mt-1">
            {t('predefinedNameCannotBeChanged')}
          </p>
        )}
      </div>

      <div>
        <Input
          label={t('emailSubject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={errors.subject}
          placeholder="ex: Confirmă contul tău"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          {t('htmlContent')}
        </label>
        <HtmlEditor
          value={htmlContent}
          onChange={setHtmlContent}
          placeholder="<html>...</html>"
          error={errors.htmlContent}
          minHeight="500px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          {t('textContent')} ({t('optional')})
        </label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[200px] font-mono text-sm"
          placeholder="Versiunea text a emailului..."
        />
      </div>

      <VariableHelper
        variables={detectedVariables}
        category={template?.category || 'custom'}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
        />
        <label htmlFor="isActive" className="ml-2 text-sm text-text-primary">
          {t('templateActive')}
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('cancel')}
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {template ? t('saveChanges') : t('createTemplate')}
        </Button>
      </div>
    </form>
  );
}

