'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface InvoiceTemplateEditorProps {
  template: any;
  onChange: (template: any) => void;
}

const AVAILABLE_TAGS = [
  { tag: '{contractNumber}', labelKey: 'contractNumber' },
  { tag: '{title}', labelKey: 'title' },
  { tag: '{assetReference}', labelKey: 'assetReference' },
  { tag: '{clientName}', labelKey: 'clientName' },
  { tag: '{startDate}', labelKey: 'startDate' },
  { tag: '{endDate}', labelKey: 'endDate' },
  { tag: '{periodMonth}', labelKey: 'periodMonth' },
  { tag: '{periodYear}', labelKey: 'periodYear' },
  { tag: '{amount}', labelKey: 'amount' },
];

export function InvoiceTemplateEditor({ template, onChange }: InvoiceTemplateEditorProps) {
  const t = useTranslations('common');
  const [localDescription, setLocalDescription] = useState(template?.description || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionStartRef = useRef<number>(0);
  const selectionEndRef = useRef<number>(0);

  // Sync local state with prop when template changes externally
  useEffect(() => {
    setLocalDescription(template?.description || '');
  }, [template?.description]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalDescription(newValue);
    
    // Save cursor position
    if (textareaRef.current) {
      selectionStartRef.current = textareaRef.current.selectionStart;
      selectionEndRef.current = textareaRef.current.selectionEnd;
    }
    
    // Update parent immediately
    onChange({
      ...template,
      description: newValue,
    });
  };

  // Restore cursor position after render
  useEffect(() => {
    if (textareaRef.current && selectionStartRef.current !== null) {
      textareaRef.current.setSelectionRange(selectionStartRef.current, selectionEndRef.current);
    }
  });

  const handleTagClick = (tag: string) => {
    const currentDesc = localDescription;
    const newDesc = currentDesc + tag;
    setLocalDescription(newDesc);
    onChange({
      ...template,
      description: newDesc,
    });
    
    // Focus textarea and set cursor at end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = newDesc.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  return (
    <div className="space-y-4 bg-bg-secondary p-4 rounded-lg border border-border">
      <div>
        <label className="block text-sm font-medium mb-2 text-text-primary">{t('availableTags') || 'Available Tags'}</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {AVAILABLE_TAGS.map(({ tag, labelKey }) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors"
              title={t(labelKey) || labelKey}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('description')} {t('template') || 'Template'}</label>
          <textarea
            ref={textareaRef}
            value={localDescription}
            onChange={handleDescriptionChange}
            placeholder="{assetReference} sau {title} sau Contract {contractNumber} - Perioada {periodMonth}/{periodYear}"
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
          />
          <p className="text-xs text-text-secondary mt-1">
            {t('templateHelp') || 'Click on tags above to insert them, or type manually'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            step="0.01"
            label={`${t('quantity')} ${t('default') || 'Default'}`}
            value={template?.quantity || '1'}
            onChange={(e) => onChange({ ...template, quantity: parseFloat(e.target.value) || 1 })}
          />
          <Input
            type="number"
            step="0.01"
            label={`${t('vat')} ${t('rate') || 'Rate'} (%)`}
            value={template?.vatRate || '0'}
            onChange={(e) => onChange({ ...template, vatRate: parseFloat(e.target.value) || 0 })}
          />
          <div className="col-span-2">
            <Select
              label={t('useContractAmount') || 'Use Contract Amount'}
              value={template?.useContractAmount !== false ? 'true' : 'false'}
              onChange={(e) => onChange({ ...template, useContractAmount: e.target.value === 'true' })}
              options={[
                { value: 'true', label: t('yes') || 'Yes' },
                { value: 'false', label: t('no') || 'No' },
              ]}
            />
          </div>
          {template?.useContractAmount === false && (
            <div className="col-span-2">
              <Input
                type="number"
                step="0.01"
                label={`${t('unitPrice')} ${t('override') || 'Override'}`}
                value={template?.unitPrice || ''}
                onChange={(e) => onChange({ ...template, unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder={t('leaveEmptyToUseContractAmount') || 'Leave empty to use contract amount'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

