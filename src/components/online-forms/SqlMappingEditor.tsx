'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMappingDatasets } from '@/hooks/useMappingDatasets';
import { useTranslations } from 'next-intl';

interface SqlMappingEditorProps {
  targetModule: 'registratura' | 'general_register' | 'events' | 'partners';
  value?: {
    sqlQuery?: string;
    targetColumn?: string;
  };
  onChange?: (value: { sqlQuery: string; targetColumn: string }) => void;
}

export function SqlMappingEditor({ targetModule, value, onChange }: SqlMappingEditorProps) {
  const tForms = useTranslations('online-forms');
  const [sqlQuery, setSqlQuery] = useState(value?.sqlQuery || '');
  const [targetColumn, setTargetColumn] = useState(value?.targetColumn || '');
  const [testResult, setTestResult] = useState<{ columns: string[]; sampleRow?: any } | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { testSqlQuery } = useMappingDatasets();

  const handleTestQuery = async () => {
    if (!sqlQuery.trim()) {
      setError(tForms('pleaseEnterSqlQuery'));
      return;
    }

    setTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await testSqlQuery(sqlQuery, targetModule);
      setTestResult(result);
      
      // Auto-select first column if available and not already selected
      if (result.columns && result.columns.length > 0 && !targetColumn) {
        setTargetColumn(result.columns[0]);
        onChange?.({ sqlQuery, targetColumn: result.columns[0] });
      } else if (targetColumn) {
        onChange?.({ sqlQuery, targetColumn });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tForms('failedToTestQuery');
      setError(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const handleSqlChange = (newSql: string) => {
    setSqlQuery(newSql);
    setTestResult(null);
    setError(null);
    onChange?.({ sqlQuery: newSql, targetColumn });
  };

  const handleColumnSelect = (column: string) => {
    setTargetColumn(column);
    onChange?.({ sqlQuery, targetColumn: column });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{tForms('sqlQuery')}</label>
        <textarea
          value={sqlQuery}
          onChange={(e) => handleSqlChange(e.target.value)}
          placeholder={tForms('sqlQueryPlaceholder')}
          className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
          rows={6}
        />
        <p className="text-xs text-gray-500 mt-1">
          {tForms('sqlQueryHelp')}
        </p>
      </div>

      <Button
        type="button"
        onClick={handleTestQuery}
        disabled={testing || !sqlQuery.trim()}
        variant="secondary"
      >
        {testing ? tForms('testing') : tForms('testQuery')}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {testResult && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700 font-medium">{tForms('queryExecutedSuccessfully')}</p>
            <p className="text-xs text-green-600 mt-1">
              {tForms('foundColumns', { 
                count: testResult.columns.length,
                plural: testResult.columns.length === 1 ? tForms('column') : tForms('columns')
              })}
            </p>
          </div>

          {testResult.columns.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">{tForms('selectTargetColumn')}</label>
              <select
                value={targetColumn}
                onChange={(e) => handleColumnSelect(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">{tForms('selectColumn')}</option>
                {testResult.columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {testResult.sampleRow && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs font-medium mb-2">{tForms('sampleResult')}</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult.sampleRow, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


