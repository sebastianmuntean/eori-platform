'use client';

import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';
import { EventType, EventStatus } from '@/hooks/useEvents';
import { useTranslations } from 'next-intl';
import { EVENT_TYPES, EVENT_STATUS_OPTIONS } from './constants';

interface EventFormData {
  parishId: string;
  type: EventType;
  status: EventStatus;
  eventDate: string;
  location: string;
  priestName: string;
  notes: string;
}

interface EventFormFieldsProps {
  formData: EventFormData;
  parishes: Parish[];
  showStatusField?: boolean;
  showTypeField?: boolean;
  validationError: string | null;
  onFormDataChange: (updates: Partial<EventFormData>) => void;
  onValidationErrorClear: () => void;
}

/**
 * Reusable form fields component for event forms
 * Used in both add and edit modals
 */
export function EventFormFields({
  formData,
  parishes,
  showStatusField = false,
  showTypeField = true,
  validationError,
  onFormDataChange,
  onValidationErrorClear,
}: EventFormFieldsProps) {
  const t = useTranslations('common');

  const handleFieldChange = (field: keyof EventFormData, value: string) => {
    onFormDataChange({ [field]: value });
    if (validationError) {
      onValidationErrorClear();
    }
  };

  return (
    <div className="space-y-4">
      {validationError && (
        <div className="p-3 bg-danger/10 text-danger rounded-md text-sm">
          {validationError}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('parish')} *
        </label>
        <select
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          value={formData.parishId}
          onChange={(e) => handleFieldChange('parishId', e.target.value)}
          required
        >
          <option value="">{t('selectParish')}</option>
          {parishes.map((parish) => (
            <option key={parish.id} value={parish.id}>
              {parish.name}
            </option>
          ))}
        </select>
      </div>

      {showTypeField && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('type')} *
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.type}
            onChange={(e) => handleFieldChange('type', e.target.value as EventType)}
            required
          >
            <option value={EVENT_TYPES.WEDDING}>{t('wedding')}</option>
            <option value={EVENT_TYPES.BAPTISM}>{t('baptism')}</option>
            <option value={EVENT_TYPES.FUNERAL}>{t('funeral')}</option>
          </select>
        </div>
      )}

      {showStatusField && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('status')}
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.status}
            onChange={(e) => handleFieldChange('status', e.target.value as EventStatus)}
          >
            {EVENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey) || option.fallback}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('date')}
        </label>
        <Input
          type="date"
          value={formData.eventDate}
          onChange={(e) => handleFieldChange('eventDate', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('location')}
        </label>
        <Input
          value={formData.location}
          onChange={(e) => handleFieldChange('location', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('priest')}
        </label>
        <Input
          value={formData.priestName}
          onChange={(e) => handleFieldChange('priestName', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('notes')}
        </label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
}

