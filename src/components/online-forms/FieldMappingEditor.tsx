'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormFieldMapping } from '@/hooks/useFormMappings';
import { useTranslations } from 'next-intl';

interface FieldMappingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Partial<FormFieldMapping>) => Promise<void>;
  mapping?: FormFieldMapping | null;
  fieldKey?: string;
  targetModule: 'registratura' | 'general_register' | 'events' | 'clients';
  availableFieldKeys: string[];
}

// Target tables and columns for each module
const TARGET_TABLES: Record<string, { table: string; columns: string[] }> = {
  registratura: {
    table: 'document_registry',
    columns: [
      'subject',
      'content',
      'sender_name',
      'sender_doc_number',
      'sender_doc_date',
      'recipient_name',
      'external_number',
      'external_date',
      'priority',
      'department_id',
      'assigned_to',
      'due_date',
    ],
  },
  general_register: {
    table: 'general_register',
    columns: [
      'document_number',
      'subject',
      'description',
      'from',
      'to',
      'date',
    ],
  },
  events: {
    table: 'church_events',
    columns: [
      'event_date',
      'location',
      'notes',
      'priest_name',
    ],
  },
  clients: {
    table: 'clients',
    columns: [
      'first_name',
      'last_name',
      'company_name',
      'cnp',
      'cui',
      'address',
      'city',
      'phone',
      'email',
    ],
  },
};

export function FieldMappingEditor({
  isOpen,
  onClose,
  onSave,
  mapping,
  fieldKey,
  targetModule,
  availableFieldKeys,
}: FieldMappingEditorProps) {
  const t = useTranslations('online-forms');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState<Partial<FormFieldMapping>>({
    fieldKey: '',
    targetTable: '',
    targetColumn: '',
    transformation: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetInfo = TARGET_TABLES[targetModule] || { table: '', columns: [] };

  useEffect(() => {
    if (mapping) {
      setFormData({
        fieldKey: mapping.fieldKey,
        targetTable: mapping.targetTable,
        targetColumn: mapping.targetColumn,
        transformation: mapping.transformation,
      });
    } else {
      setFormData({
        fieldKey: fieldKey || '',
        targetTable: targetInfo.table,
        targetColumn: '',
        transformation: null,
      });
    }
    setErrors({});
  }, [mapping, fieldKey, targetModule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.fieldKey?.trim()) {
      setErrors({ fieldKey: tCommon('required') });
      return;
    }

    if (!formData.targetTable?.trim()) {
      setErrors({ targetTable: tCommon('required') });
      return;
    }

    if (!formData.targetColumn?.trim()) {
      setErrors({ targetColumn: tCommon('required') });
      return;
    }

    await onSave(formData);
    onClose();
  };

  const columnOptions = targetInfo.columns.map((col) => ({
    value: col,
    label: col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mapping ? t('editMapping') : t('addMapping')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label={t('fieldKey')}
          value={formData.fieldKey || ''}
          onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
          options={availableFieldKeys.map((key) => ({ value: key, label: key }))}
          required
          error={errors.fieldKey}
          disabled={!!mapping || !!fieldKey}
        />

        <Input
          label={t('targetTable')}
          value={formData.targetTable || ''}
          onChange={(e) => setFormData({ ...formData, targetTable: e.target.value })}
          required
          error={errors.targetTable}
          disabled
          helperText={`Table for ${targetModule} module`}
        />

        <Select
          label={t('targetColumn')}
          value={formData.targetColumn || ''}
          onChange={(e) => setFormData({ ...formData, targetColumn: e.target.value })}
          options={columnOptions}
          required
          error={errors.targetColumn}
          placeholder="Select target column"
        />

        <div>
          <label className="block text-sm font-medium mb-1">{t('transformation')}</label>
          <textarea
            className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
            value={formData.transformation ? JSON.stringify(formData.transformation, null, 2) : ''}
            onChange={(e) => {
              try {
                const value = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                setFormData({ ...formData, transformation: value });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            placeholder='{"type": "concat", "fields": ["firstName", "lastName"]}'
          />
          <p className="text-xs text-text-secondary mt-1">
            Optional: JSON transformation rules (leave empty if not needed)
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit">
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}




