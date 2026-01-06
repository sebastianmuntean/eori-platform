'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { InvoiceTemplateEditor } from '@/components/contracts/InvoiceTemplateEditor';
import { useTranslations } from 'next-intl';

export interface ContractFormData {
  parishId: string;
  contractNumber: string;
  direction: 'incoming' | 'outgoing';
  type: 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  clientId: string;
  title: string;
  startDate: string;
  endDate: string;
  signingDate: string;
  amount: string;
  currency: string;
  paymentFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'one_time' | 'custom';
  assetReference: string;
  description: string;
  terms: string;
  notes: string;
  renewalDate: string;
  autoRenewal: boolean;
  parentContractId: string;
  invoiceItemTemplate: any;
}

interface ContractFormFieldsProps {
  formData: ContractFormData;
  onFormDataChange: (data: Partial<ContractFormData>) => void;
  parishes: Parish[];
  clients: Client[];
  disabled?: boolean;
}

/**
 * Reusable form fields component for contract forms
 * Used in both Add and Edit modals
 */
export function ContractFormFields({
  formData,
  onFormDataChange,
  parishes,
  clients,
  disabled = false,
}: ContractFormFieldsProps) {
  const t = useTranslations('common');

  const handleChange = (field: keyof ContractFormData, value: any) => {
    onFormDataChange({
      [field]: value,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label={`${t('parish')} *`}
          value={formData.parishId}
          onChange={(e) => handleChange('parishId', e.target.value)}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          placeholder={t('selectParish')}
          required
          disabled={disabled}
        />
        <Input
          label={`${t('contractNumber')} *`}
          value={formData.contractNumber}
          onChange={(e) => handleChange('contractNumber', e.target.value)}
          required
          disabled={disabled}
        />
        <Select
          label={`${t('direction')} *`}
          value={formData.direction}
          onChange={(e) => handleChange('direction', e.target.value as 'incoming' | 'outgoing')}
          options={[
            { value: 'incoming', label: t('incoming') },
            { value: 'outgoing', label: t('outgoing') },
          ]}
          required
          disabled={disabled}
        />
        <Select
          label={`${t('type')} *`}
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value as any)}
          options={[
            { value: 'rental', label: t('rental') },
            { value: 'concession', label: t('concession') },
            { value: 'sale_purchase', label: t('salePurchase') },
            { value: 'loan', label: t('loan') },
            { value: 'other', label: t('other') },
          ]}
          required
          disabled={disabled}
        />
        <ClientSelect
          label={t('clients')}
          value={formData.clientId}
          onChange={(value) => {
            const clientId = Array.isArray(value) ? value[0] || '' : value;
            handleChange('clientId', clientId);
          }}
          clients={clients}
          onlyCompanies={false}
          placeholder={t('selectClient')}
          required
          disabled={disabled}
        />
        <Input
          label={t('title')}
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          disabled={disabled}
        />
        <Input
          type="date"
          label={`${t('startDate')} *`}
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          required
          disabled={disabled}
        />
        <Input
          type="date"
          label={`${t('endDate')} *`}
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          required
          disabled={disabled}
        />
        <Input
          type="date"
          label={t('signingDate')}
          value={formData.signingDate}
          onChange={(e) => handleChange('signingDate', e.target.value)}
          disabled={disabled}
        />
        <Input
          type="number"
          step="0.01"
          label={`${t('amount')} *`}
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          required
          disabled={disabled}
        />
        <Input
          label={t('currency')}
          value={formData.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          disabled={disabled}
        />
        <Select
          label={`${t('paymentFrequency')} *`}
          value={formData.paymentFrequency}
          onChange={(e) => handleChange('paymentFrequency', e.target.value as any)}
          options={[
            { value: 'monthly', label: t('monthly') },
            { value: 'quarterly', label: t('quarterly') },
            { value: 'semiannual', label: t('semiannual') },
            { value: 'annual', label: t('annual') },
            { value: 'one_time', label: t('oneTime') },
            { value: 'custom', label: t('custom') },
          ]}
          required
          disabled={disabled}
        />
        <Input
          label={t('assetReference')}
          value={formData.assetReference}
          onChange={(e) => handleChange('assetReference', e.target.value)}
          disabled={disabled}
        />
        <Select
          label={t('status')}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as any)}
          options={[
            { value: 'draft', label: t('draft') },
            { value: 'active', label: t('active') },
            { value: 'expired', label: t('expired') },
            { value: 'terminated', label: t('terminated') },
          ]}
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('terms')}</label>
          <textarea
            value={formData.terms}
            onChange={(e) => handleChange('terms', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">{t('notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
            disabled={disabled}
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{t('invoiceItemTemplate')}</h3>
        <p className="text-sm text-text-secondary mb-4">{t('invoiceItemTemplateDescription')}</p>
        <InvoiceTemplateEditor
          template={formData.invoiceItemTemplate}
          onChange={(template) => handleChange('invoiceItemTemplate', template)}
        />
      </div>
    </>
  );
}





