'use client';

import React, { useState, useEffect } from 'react';
import { useParishes } from '@/hooks/useParishes';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { RegisterConfiguration } from '@/hooks/useRegisterConfigurations';
import { useTranslations } from 'next-intl';

interface RegisterConfigurationFormProps {
  registerConfiguration?: RegisterConfiguration | null;
  onSave: (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually: boolean;
    startingNumber: number;
    notes?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isCopy?: boolean;
}

export function RegisterConfigurationForm({ 
  registerConfiguration, 
  onSave, 
  onCancel, 
  loading: externalLoading,
  isCopy = false
}: RegisterConfigurationFormProps) {
  const tReg = useTranslations('registratura');
  const t = useTranslations('common');
  const { parishes, fetchParishes } = useParishes();
  
  // When copying, add " - Copie" to the name, otherwise use original name
  const getInitialName = () => {
    if (isCopy && registerConfiguration?.name) {
      return `${registerConfiguration.name} - Copie`;
    }
    return registerConfiguration?.name || '';
  };

  const [formData, setFormData] = useState({
    name: getInitialName(),
    parishId: registerConfiguration?.parishId || '',
    resetsAnnually: registerConfiguration?.resetsAnnually || false,
    startingNumber: registerConfiguration?.startingNumber || 1,
    notes: registerConfiguration?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setErrors({ name: tReg('registerConfigurations.nameRequired') });
        setLoading(false);
        return;
      }

      if (formData.startingNumber < 1) {
        setErrors({ startingNumber: tReg('registerConfigurations.startingNumberMin') });
        setLoading(false);
        return;
      }

      await onSave({
        name: formData.name.trim(),
        parishId: formData.parishId || null,
        resetsAnnually: formData.resetsAnnually,
        startingNumber: formData.startingNumber,
        notes: formData.notes.trim() || null,
      });
    } catch (err) {
      console.error('Error saving register configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {tReg('registerConfigurations.name')} <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={tReg('registerConfigurations.namePlaceholder')}
          required
          error={errors.name}
        />
      </div>

      <div>
        <label htmlFor="parishId" className="block text-sm font-medium mb-1">
          {tReg('registerConfigurations.parish')}
        </label>
        <Select
          id="parishId"
          value={formData.parishId}
          onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
          options={[
            { value: '', label: tReg('registerConfigurations.noParish') },
            ...parishes.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))
          ]}
          error={errors.parishId}
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            id="resetsAnnually"
            checked={formData.resetsAnnually}
            onChange={(e) => setFormData({ ...formData, resetsAnnually: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">{tReg('registerConfigurations.resetsAnnually')}</span>
        </label>
        <p className="text-sm text-gray-500 mt-1 ml-6">
          {tReg('registerConfigurations.resetsAnnuallyDescription')}
        </p>
      </div>

      <div>
        <label htmlFor="startingNumber" className="block text-sm font-medium mb-1">
          {tReg('registerConfigurations.startingNumber')}
        </label>
        <Input
          id="startingNumber"
          type="number"
          min="1"
          value={formData.startingNumber}
          onChange={(e) => setFormData({ ...formData, startingNumber: parseInt(e.target.value) || 1 })}
          required
          error={errors.startingNumber}
        />
        <p className="text-sm text-gray-500 mt-1">
          {tReg('registerConfigurations.startingNumberDescription')}
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          {tReg('registerConfigurations.notes')}
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder={tReg('registerConfigurations.notesPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading || externalLoading}
        >
          {tReg('registerConfigurations.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading || externalLoading}
        >
          {loading || externalLoading ? tReg('registerConfigurations.saving') : tReg('registerConfigurations.save')}
        </Button>
      </div>
    </form>
  );
}

