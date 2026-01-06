import { Input } from '@/components/ui/Input';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';

export interface PaymentFormData {
  parishId: string;
  paymentNumber: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  clientId: string;
  amount: string;
  currency: string;
  description: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'check' | '';
  referenceNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface PaymentFormFieldsProps {
  formData: PaymentFormData;
  onFormDataChange: (data: Partial<PaymentFormData>) => void;
  parishes: Parish[];
  clients: Client[];
  t: (key: string) => string;
}

export function PaymentFormFields({
  formData,
  onFormDataChange,
  parishes,
  clients,
  t,
}: PaymentFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
          <select
            value={formData.parishId}
            onChange={(e) => onFormDataChange({ parishId: e.target.value })}
            className="w-full px-3 py-2 border rounded"
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
        <Input
          label={`${t('paymentNumber')} *`}
          value={formData.paymentNumber}
          onChange={(e) => onFormDataChange({ paymentNumber: e.target.value })}
          required
        />
        <Input
          type="date"
          label={`${t('date')} *`}
          value={formData.date}
          onChange={(e) => onFormDataChange({ date: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('paymentType')} *</label>
          <select
            value={formData.type}
            onChange={(e) => onFormDataChange({ type: e.target.value as 'income' | 'expense' })}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="income">{t('income')}</option>
            <option value="expense">{t('expense')}</option>
          </select>
        </div>
        <Input
          label={t('category')}
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
        />
        <ClientSelect
          value={formData.clientId}
          onChange={(value) =>
            onFormDataChange({ clientId: Array.isArray(value) ? value[0] || '' : value })
          }
          clients={clients}
          onlyCompanies={false}
          label={t('parteneri')}
          placeholder={t('none') || 'None'}
        />
        <Input
          type="number"
          step="0.01"
          label={`${t('amount')} *`}
          value={formData.amount}
          onChange={(e) => onFormDataChange({ amount: e.target.value })}
          required
        />
        <Input
          label={t('currency')}
          value={formData.currency}
          onChange={(e) => onFormDataChange({ currency: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('paymentMethod')}</label>
          <select
            value={formData.paymentMethod}
            onChange={(e) =>
              onFormDataChange({ paymentMethod: e.target.value as PaymentFormData['paymentMethod'] })
            }
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">{t('none') || 'None'}</option>
            <option value="cash">{t('cash')}</option>
            <option value="bank_transfer">{t('bankTransfer')}</option>
            <option value="card">{t('card')}</option>
            <option value="check">{t('check')}</option>
          </select>
        </div>
        <Input
          label={t('referenceNumber')}
          value={formData.referenceNumber}
          onChange={(e) => onFormDataChange({ referenceNumber: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('status')}</label>
          <select
            value={formData.status}
            onChange={(e) =>
              onFormDataChange({ status: e.target.value as PaymentFormData['status'] })
            }
            className="w-full px-3 py-2 border rounded"
          >
            <option value="pending">{t('pending')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('description')}
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
        />
      </div>
    </>
  );
}





