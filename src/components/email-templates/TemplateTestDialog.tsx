'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmailTemplate } from '@/hooks/useEmailTemplates';
import { useTranslations } from 'next-intl';

interface TemplateTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSend: (recipientEmail: string, recipientName: string, variables: Record<string, any>) => Promise<void>;
}

export function TemplateTestDialog({
  isOpen,
  onClose,
  template,
  onSend,
}: TemplateTestDialogProps) {
  console.log('Step 1: Rendering TemplateTestDialog');
  console.log(`  IsOpen: ${isOpen}, Template: ${template?.name || 'none'}`);

  const t = useTranslations('common');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!recipientEmail || !template) return;

    console.log('Step 2: Sending test email');
    setError(null);
    setIsSending(true);

    try {
      await onSend(recipientEmail, recipientName || 'Test User', variables);
      console.log('✓ Test email sent successfully');
      setRecipientEmail('');
      setRecipientName('');
      setVariables({});
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      console.error(`❌ Error sending test email: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!template) return null;

  console.log('✓ Rendering dialog');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('sendTestEmail')} - ${template.name}`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Input
            label={t('recipientEmail')}
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="test@example.com"
            required
          />
        </div>

        <div>
          <Input
            label={t('recipientName')}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Test User"
          />
        </div>

        {template.variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('templateVariables')} ({t('optional')}):
            </label>
            <div className="space-y-2">
              {template.variables.map((varName) => (
                <Input
                  key={varName}
                  label={varName}
                  value={variables[varName] || ''}
                  onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                  placeholder={`${t('valueFor')} ${varName}`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSend} isLoading={isSending} disabled={!recipientEmail}>
            {t('sendTestEmail')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

