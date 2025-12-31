'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmailTemplate } from '@/hooks/useEmailTemplates';

interface EmailTemplatePreviewProps {
  template: EmailTemplate;
  onSendTest?: (recipientEmail: string, recipientName: string, variables: Record<string, any>) => Promise<void>;
}

function replaceTemplateVariables(content: string, variables: Record<string, any>): string {
  const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  return content.replace(variablePattern, (match, variablePath) => {
    const parts = variablePath.split('.');
    let value: any = variables;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return match;
      }
    }
    return String(value ?? match);
  });
}

export function EmailTemplatePreview({ template, onSendTest }: EmailTemplatePreviewProps) {
  console.log('Step 1: Rendering EmailTemplatePreview');
  console.log(`  Template: ${template.name}`);

  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('Test User');
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});
  const [previewSubject, setPreviewSubject] = useState(template.subject);
  const [previewHtml, setPreviewHtml] = useState(template.htmlContent);

  // Initialize test variables based on template variables
  const initializeTestVariables = () => {
    const vars: Record<string, any> = {};
    template.variables.forEach((varName) => {
      const parts = varName.split('.');
      if (parts.length === 1) {
        vars[varName] = `Sample ${varName}`;
      } else if (parts[0] === 'user') {
        if (!vars.user) vars.user = {};
        vars.user[parts[1]] = parts[1] === 'name' ? 'John Doe' : parts[1] === 'email' ? 'john@example.com' : `Sample ${parts[1]}`;
      } else if (parts[0] === 'link') {
        if (!vars.link) vars.link = {};
        vars.link[parts[1]] = 'https://example.com/link';
      } else if (parts[0] === 'app') {
        if (!vars.app) vars.app = {};
        vars.app[parts[1]] = parts[1] === 'name' ? 'Platform' : `Sample ${parts[1]}`;
      } else {
        vars[varName] = `Sample ${varName}`;
      }
    });
    setTestVariables(vars);
    updatePreview(vars);
  };

  const updatePreview = (vars: Record<string, any>) => {
    setPreviewSubject(replaceTemplateVariables(template.subject, vars));
    setPreviewHtml(replaceTemplateVariables(template.htmlContent, vars));
  };

  const handleVariableChange = (varName: string, value: any) => {
    const parts = varName.split('.');
    const newVars = { ...testVariables };
    
    if (parts.length === 1) {
      newVars[varName] = value;
    } else {
      const [first, ...rest] = parts;
      if (!newVars[first]) newVars[first] = {};
      let current: any = newVars[first];
      for (let i = 0; i < rest.length - 1; i++) {
        if (!current[rest[i]]) current[rest[i]] = {};
        current = current[rest[i]];
      }
      current[rest[rest.length - 1]] = value;
    }
    
    setTestVariables(newVars);
    updatePreview(newVars);
  };

  const handleSendTest = async () => {
    if (!testRecipientEmail || !onSendTest) return;
    console.log('Step 2: Sending test email');
    await onSendTest(testRecipientEmail, testRecipientName, testVariables);
  };

  console.log('✓ Rendering preview');
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Preview șablon</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-1">
            Subiect:
          </label>
          <div className="p-2 bg-bg-secondary rounded border border-border text-text-primary">
            {previewSubject}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-1">
            Conținut HTML:
          </label>
          <div
            className="p-4 bg-bg-secondary rounded border border-border max-h-[400px] overflow-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </Card>

      {template.variables.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Variabile de test</h3>
          <div className="space-y-3">
            {template.variables.map((varName) => {
              const parts = varName.split('.');
              const displayName = parts.length > 1 ? parts.join(' → ') : varName;
              const currentValue = parts.reduce((obj: any, key) => obj?.[key], testVariables) || '';
              
              return (
                <div key={varName}>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {displayName} ({`{{${varName}}}`}):
                  </label>
                  <Input
                    value={String(currentValue)}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Valoare pentru ${varName}`}
                  />
                </div>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={initializeTestVariables}
            className="mt-4"
          >
            Inițializează cu valori de test
          </Button>
        </Card>
      )}

      {onSendTest && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Trimite email de test</h3>
          <div className="space-y-3">
            <Input
              label="Email destinatar"
              type="email"
              value={testRecipientEmail}
              onChange={(e) => setTestRecipientEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <Input
              label="Nume destinatar"
              value={testRecipientName}
              onChange={(e) => setTestRecipientName(e.target.value)}
              placeholder="Test User"
            />
            <Button
              onClick={handleSendTest}
              disabled={!testRecipientEmail}
              className="w-full"
            >
              Trimite email de test
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}


