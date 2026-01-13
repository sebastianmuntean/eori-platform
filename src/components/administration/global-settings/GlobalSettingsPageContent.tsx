'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';
import { clearVatRateCache } from '@/lib/utils/globalSettings';

interface GlobalSettingsPageContentProps {
  locale: string;
}

interface GlobalSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export function GlobalSettingsPageContent({ locale }: GlobalSettingsPageContentProps) {
  const t = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [vatRate, setVatRate] = useState('19');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/global-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        const vatSetting = data.data.find((s: GlobalSetting) => s.key === 'default_vat_rate');
        if (vatSetting) {
          setVatRate(vatSetting.value || '19');
        }
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate VAT rate
      const vatRateNum = parseFloat(vatRate);
      if (isNaN(vatRateNum) || vatRateNum < 0 || vatRateNum > 100) {
        setError(t('invalidVatRate') || 'Invalid VAT rate. Must be between 0 and 100.');
        return;
      }

      const response = await fetch('/api/superadmin/global-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'default_vat_rate',
          value: vatRate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('settingsSaved') || 'Settings saved successfully');
        // Update local settings
        const updatedSettings = settings.map((s) =>
          s.key === 'default_vat_rate' ? { ...s, value: vatRate } : s
        );
        setSettings(updatedSettings);
        // Clear cache so new value is used immediately
        clearVatRateCache();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: t('administration') || 'Administration', href: `/${locale}/dashboard/administration` },
            { label: t('globalSettings') || 'Global Settings' },
          ]}
          title={t('globalSettings') || 'Global Settings'}
          className="mb-6"
        />
        <Card>
          <CardBody>
            <div className="text-center py-8">{t('loading')}</div>
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration') || 'Administration', href: `/${locale}/dashboard/administration` },
          { label: t('globalSettings') || 'Global Settings' },
        ]}
        title={t('globalSettings') || 'Global Settings'}
        className="mb-6"
      />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('globalSettings') || 'Global Settings'}</h2>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                label={t('defaultVatRate') || 'Cota TVA implicită (%)'}
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                helperText={t('defaultVatRateDescription') || 'Cota TVA implicită folosită în sistem (în procente)'}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('saving') || 'Saving...' : t('save') || 'Save'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

