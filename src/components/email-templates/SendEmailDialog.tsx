'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmailTemplate } from '@/hooks/useEmailTemplates';

interface SendResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSend: (recipients: Array<{ email: string; name: string }>, variables: Record<string, any>) => Promise<SendResult | null>;
}

export function SendEmailDialog({
  isOpen,
  onClose,
  template,
  onSend,
}: SendEmailDialogProps) {
  console.log('Step 1: Rendering SendEmailDialog');
  console.log(`  IsOpen: ${isOpen}, Template: ${template?.name || 'none'}`);

  const [recipients, setRecipients] = useState<Array<{ email: string; name: string }>>([
    { email: '', name: '' },
  ]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Step 2: Resetting form');
      setRecipients([{ email: '', name: '' }]);
      setVariables({});
      setError(null);
      setSuccess(null);
      setSendResult(null);
    }
  }, [isOpen]);

  const addRecipient = () => {
    console.log('Step 3: Adding new recipient');
    setRecipients([...recipients, { email: '', name: '' }]);
  };

  const removeRecipient = (index: number) => {
    console.log(`Step 4: Removing recipient at index ${index}`);
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: 'email' | 'name', value: string) => {
    console.log(`Step 5: Updating recipient ${index} ${field}`);
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const handleSend = async () => {
    if (!template) return;

    console.log('Step 6: Validating recipients');
    // Validate recipients
    const validRecipients = recipients.filter((r) => r.email.trim() !== '');
    if (validRecipients.length === 0) {
      setError('Te rugăm să adaugi cel puțin un destinatar cu email valid.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of validRecipients) {
      if (!emailRegex.test(recipient.email)) {
        setError(`Email-ul "${recipient.email}" nu este valid.`);
        return;
      }
    }

    console.log(`Step 7: Sending emails to ${validRecipients.length} recipients`);
    setError(null);
    setSuccess(null);
    setSendResult(null);
    setIsSending(true);

    try {
      const result = await onSend(validRecipients, variables);
      
      if (result) {
        console.log(`✓ Send completed: ${result.successful} successful, ${result.failed} failed`);
        setSendResult(result);
        
        if (result.failed === 0) {
          setSuccess(`✓ Toate email-urile au fost trimise cu succes! (${result.successful}/${result.total})`);
        } else if (result.successful > 0) {
          setSuccess(`✓ ${result.successful} email-uri trimise cu succes, ${result.failed} eșuate`);
        } else {
          setError(`❌ Toate email-urile au eșuat. Te rugăm să verifici erorile.`);
        }
      } else {
        setError('Eroare la trimiterea email-urilor. Te rugăm să încerci din nou.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la trimiterea email-urilor';
      console.error(`❌ Error sending emails: ${errorMessage}`);
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
      title={`Trimite Email - ${template.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-bg-secondary rounded-md">
          <p className="text-sm text-text-secondary">
            <strong>Subiect:</strong> {template.subject}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Destinatari <span className="text-danger">*</span>
          </label>
          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label={`Email ${index + 1}`}
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    placeholder="exemplu@email.com"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label={`Nume ${index + 1}`}
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                    placeholder="Nume destinatar"
                  />
                </div>
                {recipients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                    className="mb-0"
                  >
                    <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addRecipient}
              type="button"
            >
              + Adaugă destinatar
            </Button>
          </div>
        </div>

        {template.variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Variabile (opțional):
            </label>
            <div className="space-y-2">
              {template.variables.map((varName) => (
                <Input
                  key={varName}
                  label={varName}
                  value={variables[varName] || ''}
                  onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                  placeholder={`Valoare pentru ${varName}`}
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

        {success && (
          <div className="p-4 bg-success/10 border-2 border-success rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-success text-base">{success}</p>
              </div>
            </div>
          </div>
        )}

        {sendResult && (
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <h4 className="font-semibold text-text-primary mb-3">Rezultate detaliate:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-text-secondary">Total trimise:</span>
                <span className="font-medium text-text-primary">{sendResult.total}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-text-secondary">Succes:</span>
                <span className="font-medium text-success">{sendResult.successful}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-text-secondary">Eșuate:</span>
                <span className="font-medium text-danger">{sendResult.failed}</span>
              </div>
              {sendResult.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <details>
                    <summary className="cursor-pointer text-text-secondary hover:text-text-primary font-medium">
                      Vezi erorile ({sendResult.errors.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {sendResult.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-danger p-2 bg-danger/10 rounded">
                          <strong className="font-semibold">{error.email}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => {
              setSendResult(null);
              setSuccess(null);
              setError(null);
              onClose();
            }} 
            disabled={isSending}
          >
            {sendResult ? 'Închide' : 'Anulează'}
          </Button>
          {!sendResult && (
            <Button onClick={handleSend} isLoading={isSending}>
              Trimite Email
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

