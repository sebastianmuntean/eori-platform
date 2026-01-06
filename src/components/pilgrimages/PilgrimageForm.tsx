'use client';

import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';
import { PilgrimageStatus } from '@/hooks/usePilgrimages';
import { useTranslations } from 'next-intl';

export interface PilgrimageFormData {
  parishId: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: string;
  minParticipants: string;
  status: PilgrimageStatus;
  pricePerPerson: string;
  currency: string;
  organizerName: string;
  organizerContact: string;
  notes: string;
}

interface PilgrimageFormProps {
  formData: PilgrimageFormData;
  setFormData: (data: PilgrimageFormData) => void;
  parishes: Parish[];
  showStatus?: boolean;
}

/**
 * Reusable form component for pilgrimage add/edit operations
 * Extracts all form fields to eliminate duplication between add and edit modals
 */
export function PilgrimageForm({ formData, setFormData, parishes, showStatus = false }: PilgrimageFormProps) {
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  const updateField = <K extends keyof PilgrimageFormData>(field: K, value: PilgrimageFormData[K]) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
        <select
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          value={formData.parishId}
          onChange={(e) => updateField('parishId', e.target.value)}
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

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('titleField')} *</label>
        <Input
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          required
        />
      </div>

      {showStatus && (
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('status')}</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as PilgrimageStatus)}
          >
            <option value="draft">{tPilgrimages('statuses.draft')}</option>
            <option value="open">{tPilgrimages('statuses.open')}</option>
            <option value="closed">{tPilgrimages('statuses.closed')}</option>
            <option value="in_progress">{tPilgrimages('statuses.in_progress')}</option>
            <option value="completed">{tPilgrimages('statuses.completed')}</option>
            <option value="cancelled">{tPilgrimages('statuses.cancelled')}</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('description')}</label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          rows={3}
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('destination')}</label>
        <Input
          value={formData.destination}
          onChange={(e) => updateField('destination', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('startDate')}</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('endDate')}</label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('registrationDeadline')}</label>
        <Input
          type="date"
          value={formData.registrationDeadline}
          onChange={(e) => updateField('registrationDeadline', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('maxParticipants')}</label>
          <Input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => updateField('maxParticipants', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('minParticipants')}</label>
          <Input
            type="number"
            value={formData.minParticipants}
            onChange={(e) => updateField('minParticipants', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('pricePerPerson')}</label>
          <Input
            type="number"
            step="0.01"
            value={formData.pricePerPerson}
            onChange={(e) => updateField('pricePerPerson', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('currency')}</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.currency}
            onChange={(e) => updateField('currency', e.target.value)}
          >
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('organizerName')}</label>
          <Input
            value={formData.organizerName}
            onChange={(e) => updateField('organizerName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('organizerContact')}</label>
          <Input
            value={formData.organizerContact}
            onChange={(e) => updateField('organizerContact', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('notes')}</label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          rows={3}
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </div>
    </div>
  );
}






