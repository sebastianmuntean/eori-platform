'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';

export interface ChurchEvent {
  id?: string;
  parishId: string;
  type: 'wedding' | 'baptism' | 'funeral';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  eventDate: string | null;
  location: string | null;
  priestName: string | null;
  notes: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface EventFormProps {
  event?: ChurchEvent | null;
  parishes: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ChurchEvent>) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({
  event,
  parishes,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: EventFormProps) {
  const t = useTranslations('common');
  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    parishId: '',
    type: 'wedding',
    status: 'pending',
    eventDate: null,
    location: null,
    priestName: null,
    notes: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        parishId: event.parishId,
        type: event.type,
        status: event.status,
        eventDate: event.eventDate || null,
        location: event.location || null,
        priestName: event.priestName || null,
        notes: event.notes || null,
      });
    } else {
      setFormData({
        parishId: '',
        type: 'wedding',
        status: 'pending',
        eventDate: null,
        location: null,
        priestName: null,
        notes: null,
      });
    }
    setErrors({});
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.parishId) {
      newErrors.parishId = t('parishRequired');
    }
    if (!formData.type) {
      newErrors.type = t('eventTypeRequired');
    }
    if (!formData.status) {
      newErrors.status = t('statusRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (
    field: keyof ChurchEvent,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? t('editEvent') : t('addEvent')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parish */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('parish')} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.parishId || ''}
              onChange={(e) => handleChange('parishId', e.target.value || null)}
              className={`w-full px-4 py-2 border rounded-md ${
                errors.parishId ? 'border-danger' : 'border-border'
              } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              <option value="">{t('selectParish')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            {errors.parishId && (
              <p className="mt-1 text-sm text-danger">{errors.parishId}</p>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('eventType')} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.type || 'wedding'}
              onChange={(e) =>
                handleChange('type', e.target.value as 'wedding' | 'baptism' | 'funeral')
              }
              className={`w-full px-4 py-2 border rounded-md ${
                errors.type ? 'border-danger' : 'border-border'
              } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              <option value="wedding">{t('wedding')}</option>
              <option value="baptism">{t('baptism')}</option>
              <option value="funeral">{t('funeral')}</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-danger">{errors.type}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('status')} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.status || 'pending'}
              onChange={(e) =>
                handleChange(
                  'status',
                  e.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled'
                )
              }
              className={`w-full px-4 py-2 border rounded-md ${
                errors.status ? 'border-danger' : 'border-border'
              } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              <option value="pending">{t('pending')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-danger">{errors.status}</p>
            )}
          </div>

          {/* Event Date */}
          <div>
            <Input
              label={t('eventDate')}
              type="date"
              value={formData.eventDate || ''}
              onChange={(e) => handleChange('eventDate', e.target.value || null)}
              error={errors.eventDate}
            />
          </div>

          {/* Location */}
          <div>
            <Input
              label={t('location')}
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value || null)}
              placeholder={t('eventLocationPlaceholder')}
              error={errors.location}
            />
          </div>

          {/* Priest Name */}
          <div>
            <Input
              label={t('priestName')}
              value={formData.priestName || ''}
              onChange={(e) => handleChange('priestName', e.target.value || null)}
              placeholder={t('priestNamePlaceholder')}
              error={errors.priestName}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t('notes')}
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value || null)}
            rows={4}
            className={`w-full px-4 py-2 border rounded-md ${
              errors.notes ? 'border-danger' : 'border-border'
            } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder={t('eventNotesPlaceholder')}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-danger">{errors.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {event ? t('saveChanges') : t('createEvent')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

