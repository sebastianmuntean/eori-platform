'use client';

import { FormField, FormFieldType } from '@/hooks/useFormFields';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

interface FormPreviewProps {
  fields: FormField[];
  formName?: string;
  formDescription?: string | null;
  onSubmit?: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

export function FormPreview({
  fields,
  formName,
  formDescription,
  onSubmit,
  readOnly = false,
}: FormPreviewProps) {
  const t = useTranslations('online-forms');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.fieldKey] || '';

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            key={field.id}
            label={field.label}
            type={field.fieldType === 'number' ? 'number' : field.fieldType === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            placeholder={field.placeholder || ''}
            required={field.isRequired}
            disabled={readOnly}
            helperText={field.helpText || undefined}
          />
        );

      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.isRequired && <span className="text-danger">*</span>}
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
              placeholder={field.placeholder || ''}
              required={field.isRequired}
              disabled={readOnly}
              rows={4}
            />
            {field.helpText && (
              <p className="text-xs text-text-secondary mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <Select
            key={field.id}
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
            required={field.isRequired}
            disabled={readOnly}
            helperText={field.helpText || undefined}
          />
        );

      case 'date':
        return (
          <Input
            key={field.id}
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldKey]: e.target.value })}
            required={field.isRequired}
            disabled={readOnly}
            helperText={field.helpText || undefined}
          />
        );

      case 'file':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.isRequired && <span className="text-danger">*</span>}
            </label>
            <input
              type="file"
              className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, [field.fieldKey]: file.name });
                }
              }}
              required={field.isRequired}
              disabled={readOnly}
            />
            {field.helpText && (
              <p className="text-xs text-text-secondary mt-1">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const sortedFields = [...fields].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <Card>
      <CardHeader>
        {formName && <h3 className="text-lg font-semibold">{formName}</h3>}
        {formDescription && <p className="text-sm text-text-secondary">{formDescription}</p>}
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {sortedFields.map((field) => renderField(field))}
          
          {!readOnly && onSubmit && (
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                {t('submit') || 'Submit'}
              </button>
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
}




