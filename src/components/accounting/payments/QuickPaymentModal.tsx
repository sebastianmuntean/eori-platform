'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Autocomplete, AutocompleteOption } from '@/components/ui/Autocomplete';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { QuickPaymentFormData } from '@/lib/types/payments';
import { getClientDisplayName, getClientName } from '@/lib/utils/client-helpers';
import { useTranslations } from 'next-intl';

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  formData: QuickPaymentFormData;
  onFormDataChange: (data: QuickPaymentFormData) => void;
  parishes: Parish[];
  clients: Client[];
  clientsLoading: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onClientSearch?: (searchTerm: string) => void;
}

/**
 * Modal component for quick payment creation
 * Simplified form for fast payment entry with email receipt option
 */
export function QuickPaymentModal({
  isOpen,
  onClose,
  onCancel,
  formData,
  onFormDataChange,
  parishes,
  clients,
  clientsLoading,
  onSubmit,
  isSubmitting = false,
  onClientSearch,
}: QuickPaymentModalProps) {
  const t = useTranslations('common');
  const params = useParams();
  const locale = (params.locale as string) || 'ro';

  // Memoize client options to avoid recalculation on every render
  // Only recalculate when clients array changes
  const clientOptions: AutocompleteOption[] = useMemo(() => {
    return clients
      .filter((client) => client.isActive)
      .map((client) => ({
        value: client.id,
        label: getClientDisplayName(client),
        client,
      }))
      .sort((a, b) => {
        const nameA = getClientName(a.client);
        const nameB = getClientName(b.client);
        return nameA.localeCompare(nameB, locale, { sensitivity: 'base' });
      });
  }, [clients, locale]);

  const handleClientChange = (value: string) => {
    // Find and set client ID by matching label
    const selectedOption = clientOptions.find(opt => opt.label === value);
    
    if (selectedOption && selectedOption.client) {
      onFormDataChange({ 
        ...formData, 
        clientId: selectedOption.value,
        clientDisplayName: value,
        // Pre-fill email from client if available
        emailAddress: selectedOption.client.email?.trim() || ''
      });
    } else {
      // Clear client ID if no match (user typing)
      onFormDataChange({ 
        ...formData, 
        clientId: '', 
        clientDisplayName: value, 
        emailAddress: '' 
      });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      title={t('quickPayment') || 'Incasare rapida'}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isSubmitting ? (t('creating') || 'Creating...') : (t('create') || 'Create')}
      cancelLabel={t('cancel')}
      size="full"
    >
      <div className="space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              value={formData.parishId}
              onChange={(e) => onFormDataChange({ ...formData, parishId: e.target.value })}
              className="w-full px-3 py-2 border rounded text-base"
              required
              disabled={isSubmitting}
            >
              <option value="">{t('selectParish') || 'Select Parish'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>

          <Autocomplete
            label={`${t('client') || 'Client'} *`}
            value={formData.clientDisplayName}
            onChange={handleClientChange}
            options={clientOptions}
            placeholder={t('searchClient') || 'Search client...'}
            onSearch={onClientSearch}
            loading={clientsLoading}
            getOptionLabel={(option) => option.label}
          />

          <Input
            type="number"
            step="0.01"
            label={`${t('amount')} *`}
            value={formData.amount}
            onChange={(e) => onFormDataChange({ ...formData, amount: e.target.value })}
            required
            className="text-base"
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium mb-1">{t('paymentCategory') || 'Tip încasare'} *</label>
            <select
              value={formData.category}
              onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded text-base"
              required
              disabled={isSubmitting}
            >
              <option value="">{t('selectCategory') || 'Selectează tipul...'}</option>
              <option value="donation">{t('donation') || 'Donație'}</option>
              <option value="invoice_payment">{t('invoicePayment') || 'Plată factură'}</option>
              <option value="service_payment">{t('servicePayment') || 'Plată servicii'}</option>
              <option value="rent">{t('rent') || 'Chirie'}</option>
              <option value="offering">{t('offering') || 'Pomană'}</option>
              <option value="other">{t('other') || 'Altele'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('reason') || 'Motiv'} *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => onFormDataChange({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded text-base min-h-[100px]"
              placeholder={t('enterReason') || 'Enter payment reason...'}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="sendEmailCheckbox"
                checked={formData.sendEmail}
                onChange={(e) => onFormDataChange({ ...formData, sendEmail: e.target.checked })}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                disabled={isSubmitting}
              />
              <label htmlFor="sendEmailCheckbox" className="text-sm font-medium cursor-pointer">
                {t('sendReceiptByEmail') || 'Trimite chitanta prin email la'} {formData.emailAddress ? `"${formData.emailAddress}"` : t('clientEmailAddress') || 'adresa din client'}
              </label>
            </div>
            
            {formData.sendEmail && (
              <Input
                type="email"
                label={t('emailAddress') || 'Adresa de email'}
                value={formData.emailAddress}
                onChange={(e) => onFormDataChange({ ...formData, emailAddress: e.target.value })}
                placeholder={t('enterEmailAddress') || 'Introdu adresa de email...'}
                className="text-base"
                disabled={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}

