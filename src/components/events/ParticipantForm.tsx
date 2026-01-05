'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';

export interface ChurchEventParticipant {
  id?: string;
  eventId: string;
  parishionerId?: string | null;
  role: 'bride' | 'groom' | 'baptized' | 'deceased' | 'godparent' | 'witness' | 'parent' | 'family_member' | 'other';
  firstName: string;
  lastName?: string | null;
  birthDate?: string | null;
  cnp?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

interface ParticipantFormProps {
  participant?: ChurchEventParticipant | null;
  eventType: 'wedding' | 'baptism' | 'funeral';
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ChurchEventParticipant>) => Promise<void>;
  isLoading?: boolean;
}

const getRoleOptionsByEventType = (t: any): Record<
  'wedding' | 'baptism' | 'funeral',
  Array<{ value: ChurchEventParticipant['role']; label: string }>
> => ({
  wedding: [
    { value: 'groom', label: t('groom') },
    { value: 'bride', label: t('bride') },
    { value: 'witness', label: t('witness') },
    { value: 'parent', label: t('parent') },
    { value: 'other', label: t('other') },
  ],
  baptism: [
    { value: 'baptized', label: t('baptized') },
    { value: 'godparent', label: t('godparent') },
    { value: 'parent', label: t('parent') },
    { value: 'witness', label: t('witness') },
    { value: 'other', label: t('other') },
  ],
  funeral: [
    { value: 'deceased', label: t('deceased') },
    { value: 'family_member', label: t('familyMember') },
    { value: 'witness', label: t('witness') },
    { value: 'other', label: t('other') },
  ],
});

export function ParticipantForm({
  participant,
  eventType,
  eventId,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ParticipantFormProps) {
  const t = useTranslations('common');
  const roleOptionsByEventType = getRoleOptionsByEventType(t);
  const [formData, setFormData] = useState<Partial<ChurchEventParticipant>>({
    eventId,
    role: roleOptionsByEventType[eventType][0].value,
    firstName: '',
    lastName: null,
    birthDate: null,
    cnp: null,
    address: null,
    city: null,
    phone: null,
    email: null,
    notes: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (participant) {
      setFormData({
        eventId: participant.eventId,
        parishionerId: participant.parishionerId || null,
        role: participant.role,
        firstName: participant.firstName,
        lastName: participant.lastName || null,
        birthDate: participant.birthDate || null,
        cnp: participant.cnp || null,
        address: participant.address || null,
        city: participant.city || null,
        phone: participant.phone || null,
        email: participant.email || null,
        notes: participant.notes || null,
      });
    } else {
      setFormData({
        eventId,
        role: roleOptionsByEventType[eventType][0].value,
        firstName: '',
        lastName: null,
        birthDate: null,
        cnp: null,
        address: null,
        city: null,
        phone: null,
        email: null,
        notes: null,
      });
    }
    setErrors({});
  }, [participant, eventType, eventId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName || formData.firstName.trim() === '') {
      newErrors.firstName = t('firstNameRequired');
    }
    if (!formData.role) {
      newErrors.role = t('roleRequired');
    }

    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('invalidEmail');
      }
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
    field: keyof ChurchEventParticipant,
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

  const roleOptions = roleOptionsByEventType[eventType];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={participant ? t('editParticipant') : t('addParticipant')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('participantRole')} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.role || ''}
              onChange={(e) =>
                handleChange('role', e.target.value as ChurchEventParticipant['role'])
              }
              className={`w-full px-4 py-2 border rounded-md ${
                errors.role ? 'border-danger' : 'border-border'
              } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-danger">{errors.role}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <Input
              label={t('firstName')}
              value={formData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value || null)}
              required
              error={errors.firstName}
            />
          </div>

          {/* Last Name */}
          <div>
            <Input
              label={t('lastName')}
              value={formData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value || null)}
              error={errors.lastName}
            />
          </div>

          {/* Birth Date */}
          <div>
            <Input
              label={t('birthDate')}
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => handleChange('birthDate', e.target.value || null)}
              error={errors.birthDate}
            />
          </div>

          {/* CNP */}
          <div>
            <Input
              label={t('cnp')}
              value={formData.cnp || ''}
              onChange={(e) => handleChange('cnp', e.target.value || null)}
              maxLength={13}
              error={errors.cnp}
            />
          </div>

          {/* Address */}
          <div>
            <Input
              label={t('address')}
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value || null)}
              error={errors.address}
            />
          </div>

          {/* City */}
          <div>
            <Input
              label={t('city')}
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value || null)}
              error={errors.city}
            />
          </div>

          {/* Phone */}
          <div>
            <Input
              label={t('phone')}
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value || null)}
              error={errors.phone}
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value || null)}
              error={errors.email}
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
            rows={3}
            className={`w-full px-4 py-2 border rounded-md ${
              errors.notes ? 'border-danger' : 'border-border'
            } bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder={t('participantNotesPlaceholder')}
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
            {participant ? t('saveChanges') : t('addParticipant')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

