'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { useMappingDatasets } from '@/hooks/useMappingDatasets';
import { useParishes } from '@/hooks/useParishes';
import { MappingEditorModal, Mapping } from '@/components/online-forms/MappingEditorModal';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';

export default function CreateMappingDatasetPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  // Check permission to view mapping datasets
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_VIEW);

  // All hooks must be called before any conditional returns
  const { createDataset } = useMappingDatasets();
  const { parishes, fetchParishes } = useParishes();
  const { toasts, success, error: showError, removeToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetModule: 'registratura' as 'registratura' | 'general_register' | 'events' | 'clients',
    parishId: '' as string | null,
    isDefault: false,
  });

  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const handleSave = useCallback(async () => {
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: t('required') });
      return;
    }

    setLoading(true);
    try {
      await createDataset({
        ...formData,
        description: formData.description || null,
        parishId: formData.parishId || null,
        mappings,
      });

      success(tForms('datasetCreated'));
      router.push(`/${locale}/dashboard/registry/online-forms/mapping-datasets`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la crearea dataset-ului';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, mappings, createDataset, t, tForms, success, showError, locale, router]);

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/registry/online-forms/mapping-datasets`);
  };

  const handleAddMapping = () => {
    setEditingMapping(null);
    setEditingIndex(-1);
    setShowMappingEditor(true);
  };

  const handleEditMapping = (index: number) => {
    setEditingMapping(mappings[index]);
    setEditingIndex(index);
    setShowMappingEditor(true);
  };

  const handleDeleteMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleSaveMapping = (mapping: Mapping) => {
    if (editingIndex >= 0) {
      const updated = [...mappings];
      updated[editingIndex] = mapping;
      setMappings(updated);
    } else {
      setMappings([...mappings, mapping]);
    }
    setShowMappingEditor(false);
    setEditingMapping(null);
    setEditingIndex(-1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/registry/online-forms` },
          { label: tForms('mappingDatasets'), href: `/${locale}/dashboard/registry/online-forms/mapping-datasets` },
          { label: tForms('createDataset') },
        ]}
        title={tForms('createDataset') || 'Create Dataset'}
        className="mb-6"
      />

      <Card>
        <CardBody>
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{tForms('basicConfiguration')}</h2>

              <Input
                label={tForms('datasetName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={errors.name}
              />

              <Input
                label={tForms('datasetDescription')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Select
                label={tForms('targetModule')}
                value={formData.targetModule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetModule: e.target.value as any,
                  })
                }
                options={[
                  { value: 'registratura', label: tForms('targetModuleRegistratura') },
                  { value: 'general_register', label: tForms('targetModuleGeneralRegister') },
                  { value: 'events', label: tForms('targetModuleEvents') },
                  { value: 'clients', label: tForms('targetModuleClients') },
                ]}
                required
              />

              <Select
                label={tForms('scope')}
                value={formData.parishId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parishId: e.target.value || null,
                  })
                }
                options={[
                  { value: '', label: tForms('globalTemplate') },
                  ...parishes.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm">
                  {tForms('isDefault')}
                </label>
              </div>
            </div>

            {/* Mappings */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{tForms('mappings')}</h2>
                <Button onClick={handleAddMapping}>{tForms('addMapping')}</Button>
              </div>

              {mappings.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  {tForms('noMappingsMessage', { addMapping: tForms('addMapping') })}
                </div>
              ) : (
                <Table
                  columns={[
                    { key: 'fieldKey', label: tForms('fieldKey') },
                    { key: 'targetTable', label: tForms('targetTable') },
                    { key: 'targetColumn', label: tForms('targetColumn') },
                    { key: 'mappingType', label: tForms('mappingType') },
                    {
                      key: 'actions',
                      label: t('actions'),
                      render: (value: any, row: any) => {
                        const index = mappings.findIndex((m) => m.fieldKey === row.fieldKey);
                        return (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMapping(index)}
                            >
                              {t('edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteMapping(index)}
                            >
                              {t('delete')}
                            </Button>
                          </div>
                        );
                      },
                    },
                  ]}
                  data={mappings.map((m, i) => ({
                    id: i.toString(),
                    fieldKey: m.fieldKey,
                    targetTable: m.targetTable,
                    targetColumn: m.targetColumn,
                    mappingType:
                      m.mappingType === 'direct'
                        ? tForms('mappingTypeDirect')
                        : m.mappingType === 'sql'
                        ? tForms('mappingTypeSql')
                        : tForms('mappingTypeTransformation'),
                    actions: null,
                  }))}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={handleCancel}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t('loading') : t('save')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Mapping Editor Modal */}
      <MappingEditorModal
        isOpen={showMappingEditor}
        onClose={() => {
          setShowMappingEditor(false);
          setEditingMapping(null);
          setEditingIndex(-1);
        }}
        onSave={handleSaveMapping}
        mapping={editingMapping}
        targetModule={formData.targetModule}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
