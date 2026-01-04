'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormField, FormFieldType, FormFieldOption } from '@/hooks/useFormFields';
import { useTranslations } from 'next-intl';

interface FormFieldEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: Partial<FormField>) => Promise<void>;
  field?: FormField | null;
  existingFieldKeys: string[];
}

export function FormFieldEditor({
  isOpen,
  onClose,
  onSave,
  field,
  existingFieldKeys,
}: FormFieldEditorProps) {
  const t = useTranslations('online-forms');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState<Partial<FormField>>({
    fieldKey: '',
    fieldType: 'text',
    label: '',
    placeholder: '',
    helpText: '',
    isRequired: false,
    validationRules: null,
    options: null,
    orderIndex: 0,
  });

  const [options, setOptions] = useState<FormFieldOption[]>([]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (field) {
      setFormData({
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        isRequired: field.isRequired,
        validationRules: field.validationRules,
        options: field.options,
        orderIndex: field.orderIndex,
      });
      setOptions(field.options || []);
    } else {
      setFormData({
        fieldKey: '',
        fieldType: 'text',
        label: '',
        placeholder: '',
        helpText: '',
        isRequired: false,
        validationRules: null,
        options: null,
        orderIndex: 0,
      });
      setOptions([]);
    }
    setErrors({});
  }, [field, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.fieldKey?.trim()) {
      setErrors({ fieldKey: tCommon('required') });
      return;
    }

    if (!field && existingFieldKeys.includes(formData.fieldKey!)) {
      setErrors({ fieldKey: 'Field key already exists' });
      return;
    }

    if (!formData.label?.trim()) {
      setErrors({ label: tCommon('required') });
      return;
    }

    if (formData.fieldType === 'select' && options.length === 0) {
      setErrors({ options: 'At least one option is required for select fields' });
      return;
    }

    const fieldData = {
      ...formData,
      options: formData.fieldType === 'select' ? options : null,
    };

    await onSave(fieldData);
    onClose();
  };

  const addOption = () => {
    if (newOptionValue.trim() && newOptionLabel.trim()) {
      setOptions([...options, { value: newOptionValue, label: newOptionLabel }]);
      setNewOptionValue('');
      setNewOptionLabel('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const fieldTypeOptions = [
    { value: 'text', label: t('fieldTypeText') },
    { value: 'email', label: t('fieldTypeEmail') },
    { value: 'textarea', label: t('fieldTypeTextarea') },
    { value: 'select', label: t('fieldTypeSelect') },
    { value: 'date', label: t('fieldTypeDate') },
    { value: 'number', label: t('fieldTypeNumber') },
    { value: 'file', label: t('fieldTypeFile') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={field ? t('editField') : t('addField')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('fieldKey')}
            value={formData.fieldKey || ''}
            onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
            required
            error={errors.fieldKey}
            disabled={!!field}
            helperText="Unique identifier (e.g., 'firstName', 'email')"
          />

          <Select
            label={t('fieldType')}
            value={formData.fieldType || 'text'}
            onChange={(e) => {
              const newType = e.target.value as FormFieldType;
              setFormData({
                ...formData,
                fieldType: newType,
                options: newType === 'select' ? formData.options : null,
              });
              if (newType !== 'select') {
                setOptions([]);
              }
            }}
            options={fieldTypeOptions}
            required
          />
        </div>

        <Input
          label={t('fieldLabel')}
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          required
          error={errors.label}
        />

        <Input
          label={t('fieldPlaceholder')}
          value={formData.placeholder || ''}
          onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium mb-1">{t('fieldHelpText')}</label>
          <textarea
            className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
            value={formData.helpText || ''}
            onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRequired"
            checked={formData.isRequired || false}
            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isRequired" className="text-sm">
            {t('isRequired')}
          </label>
        </div>

        {formData.fieldType === 'select' && (
          <div>
            <label className="block text-sm font-medium mb-2">{t('options')}</label>
            {errors.options && (
              <p className="text-sm text-danger mb-2">{errors.options}</p>
            )}
            
            <div className="space-y-2 mb-4">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-bg-secondary rounded">
                  <span className="flex-1">
                    <strong>{option.value}</strong>: {option.label}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => removeOption(index)}
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t('optionValue')}
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder={t('optionLabel')}
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addOption}>
                {t('addOption')}
              </Button>
            </div>
          </div>
        )}

        <Input
          label={t('orderIndex')}
          type="number"
          value={formData.orderIndex?.toString() || '0'}
          onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
        />

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


