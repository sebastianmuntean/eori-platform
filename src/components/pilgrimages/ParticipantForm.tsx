'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ParticipantStatus } from '@/hooks/usePilgrimageParticipants';

interface ParticipantFormData {
  parishionerId: string;
  firstName: string;
  lastName: string;
  cnp: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialNeeds: string;
  status: ParticipantStatus;
  totalAmount: string;
  notes: string;
}

interface ParticipantFormProps {
  formData: ParticipantFormData;
  setFormData: (data: ParticipantFormData) => void;
  clients: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }>;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  t: (key: string) => string;
  tPilgrimages: (key: string) => string;
}

/**
 * Participant form component
 * Extracted from PilgrimageParticipantsPageContent for reusability
 */
export function ParticipantForm({
  formData,
  setFormData,
  clients,
  onSave,
  onCancel,
  loading,
  t,
  tPilgrimages,
}: ParticipantFormProps) {
  return (
    <div className="flex flex-col" style={{ height: 'calc(98vh - 80px)' }}>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {tPilgrimages('participant')} ({t('optional')})
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishionerId}
              onChange={(e) => setFormData({ ...formData, parishionerId: e.target.value })}
            >
              <option value="">{t('selectClient') || 'Select Client'}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('firstName')} *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('lastName')}</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('cnp')}</label>
              <Input
                value={formData.cnp}
                onChange={(e) => setFormData({ ...formData, cnp: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('birthDate')}</label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('phone')}</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('address')}</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('city')}</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('county')}</label>
              <Input
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('postalCode')}</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('emergencyContactName')}</label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('emergencyContactPhone')}</label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('specialNeeds')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.specialNeeds}
              onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('participantStatus')}</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ParticipantStatus })}
              >
                <option value="registered">{tPilgrimages('participantStatuses.registered')}</option>
                <option value="confirmed">{tPilgrimages('participantStatuses.confirmed')}</option>
                <option value="paid">{tPilgrimages('participantStatuses.paid')}</option>
                <option value="cancelled">{tPilgrimages('participantStatuses.cancelled')}</option>
                <option value="waitlisted">{tPilgrimages('participantStatuses.waitlisted')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('totalAmount')}</label>
              <Input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('notes')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4 pb-2 border-t border-border flex-shrink-0 bg-bg-primary">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? (t('saving') || 'Saving...') : t('save')}
        </Button>
      </div>
    </div>
  );
}

