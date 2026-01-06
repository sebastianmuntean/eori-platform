'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SqlMappingEditor } from './SqlMappingEditor';
import { AvailableTablesList } from './AvailableTablesList';
import { useTranslations } from 'next-intl';

export type MappingType = 'direct' | 'sql' | 'transformation';

export interface Mapping {
  fieldKey: string;
  targetTable: string;
  targetColumn: string;
  mappingType: MappingType;
  sqlQuery?: string;
  transformation?: any;
}

interface MappingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Mapping) => void;
  mapping: Mapping | null;
  targetModule: 'registratura' | 'general_register' | 'events' | 'clients';
}

export function MappingEditorModal({
  isOpen,
  onClose,
  onSave,
  mapping,
  targetModule,
}: MappingEditorModalProps) {
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  const [formData, setFormData] = useState<Mapping>({
    fieldKey: '',
    targetTable: '',
    targetColumn: '',
    mappingType: 'direct',
    sqlQuery: undefined,
    transformation: undefined,
  });

  const [mappingType, setMappingType] = useState<MappingType>('direct');
  const [sqlConfig, setSqlConfig] = useState<{ sqlQuery: string; targetColumn: string }>({
    sqlQuery: '',
    targetColumn: '',
  });
  const [validationError, setValidationError] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  useEffect(() => {
    if (mapping) {
      setFormData(mapping);
      setMappingType(mapping.mappingType);
      if (mapping.sqlQuery) {
        setSqlConfig({ sqlQuery: mapping.sqlQuery, targetColumn: mapping.targetColumn });
      }
    } else {
      setFormData({
        fieldKey: '',
        targetTable: '',
        targetColumn: '',
        mappingType: 'direct',
      });
      setMappingType('direct');
      setSqlConfig({ sqlQuery: '', targetColumn: '' });
    }
    // Reset errors when modal opens/closes or mapping changes
    setValidationError('');
    setJsonError('');
  }, [mapping, isOpen]);

  const handleSubmit = () => {
    setValidationError('');
    setJsonError('');

    if (!formData.fieldKey.trim()) {
      setValidationError(tForms('fieldKey') + ' ' + t('required'));
      return;
    }

    if (mappingType === 'direct' && (!formData.targetTable || !formData.targetColumn)) {
      setValidationError(tForms('pleaseSelectTableAndColumn') || 'Te rugăm să selectezi tabelul și coloana');
      return;
    }

    if (mappingType === 'sql' && (!sqlConfig.sqlQuery || !sqlConfig.targetColumn)) {
      setValidationError(tForms('pleaseEnterSqlQueryAndSelectColumn') || 'Te rugăm să introduci query-ul SQL și să selectezi coloana');
      return;
    }

    const finalMapping: Mapping = {
      ...formData,
      mappingType,
      ...(mappingType === 'sql' && {
        sqlQuery: sqlConfig.sqlQuery,
        targetColumn: sqlConfig.targetColumn,
      }),
    };

    onSave(finalMapping);
  };

  const handleTableColumnSelect = (table: string, column: string) => {
    setFormData({
      ...formData,
      targetTable: table,
      targetColumn: column,
    });
  };

  const handleTransformationChange = (value: string) => {
    setJsonError('');
    if (!value.trim()) {
      setFormData({ ...formData, transformation: undefined });
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setFormData({ ...formData, transformation: parsed });
    } catch (err) {
      setJsonError(tForms('invalidJsonFormat') || 'Format JSON invalid');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mapping ? tForms('editMapping') : tForms('addMapping')}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label={tForms('fieldKey')}
          value={formData.fieldKey}
          onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
          required
          error={validationError && !formData.fieldKey.trim() ? validationError : undefined}
        />

        <Select
          label={tForms('mappingType')}
          value={mappingType}
          onChange={(e) => setMappingType(e.target.value as MappingType)}
          options={[
            { value: 'direct', label: tForms('mappingTypeDirect') },
            { value: 'sql', label: tForms('mappingTypeSql') },
            { value: 'transformation', label: tForms('mappingTypeTransformation') },
          ]}
        />

        {mappingType === 'direct' && (
          <div className="space-y-4">
            <AvailableTablesList
              targetModule={targetModule}
              onSelectColumn={handleTableColumnSelect}
              selectedTable={formData.targetTable}
              selectedColumn={formData.targetColumn}
            />
            {validationError && !formData.targetTable && (
              <p className="text-sm text-danger">{validationError}</p>
            )}
          </div>
        )}

        {mappingType === 'sql' && (
          <div className="space-y-4">
            <SqlMappingEditor
              targetModule={targetModule}
              value={sqlConfig}
              onChange={(value) => {
                setSqlConfig(value);
                setFormData({
                  ...formData,
                  targetTable: 'sql_query', // Placeholder
                  targetColumn: value.targetColumn,
                });
              }}
            />
            {validationError && (!sqlConfig.sqlQuery || !sqlConfig.targetColumn) && (
              <p className="text-sm text-danger">{validationError}</p>
            )}
          </div>
        )}

        {mappingType === 'transformation' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {tForms('transformation')}
            </label>
            <textarea
              className={`w-full p-3 border rounded-md font-mono text-sm bg-bg-primary text-text-primary ${
                jsonError ? 'border-danger' : 'border-gray-300'
              }`}
              rows={6}
              value={
                formData.transformation
                  ? JSON.stringify(formData.transformation, null, 2)
                  : ''
              }
              onChange={(e) => handleTransformationChange(e.target.value)}
              placeholder='{"type": "concat", "fields": ["firstName", "lastName"]}'
            />
            {jsonError && <p className="text-sm text-danger mt-1">{jsonError}</p>}
          </div>
        )}

        {validationError && mappingType !== 'direct' && mappingType !== 'sql' && (
          <p className="text-sm text-danger">{validationError}</p>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('save')}</Button>
        </div>
      </div>
    </Modal>
  );
}

