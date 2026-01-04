'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface TableInfo {
  name: string;
  columns: string[];
}

interface AvailableTablesListProps {
  targetModule: 'registratura' | 'general_register' | 'events' | 'partners';
  onSelectColumn?: (table: string, column: string) => void;
  selectedTable?: string;
  selectedColumn?: string;
}

export function AvailableTablesList({
  targetModule,
  onSelectColumn,
  selectedTable,
  selectedColumn,
}: AvailableTablesListProps) {
  const tForms = useTranslations('online-forms');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, [targetModule]);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/online-forms/mapping-datasets/available-tables?targetModule=${targetModule}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tables');
      }

      setTables(result.data.tables || []);
      
      // Expand first table by default
      if (result.data.tables && result.data.tables.length > 0) {
        setExpandedTables(new Set([result.data.tables[0].name]));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tables';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">{tForms('loadingTables')}</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-sm text-gray-500">{tForms('noTablesAvailable')}</div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{tForms('availableTablesAndColumns')}</h4>
      <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-96 overflow-auto">
        {tables.map((table) => {
          const isExpanded = expandedTables.has(table.name);
          const isSelected = selectedTable === table.name;

          return (
            <div key={table.name}>
              <button
                type="button"
                onClick={() => toggleTable(table.name)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <span className="font-medium text-sm">{table.name}</span>
                <span className="text-xs text-gray-500">
                  {isExpanded ? '▼' : '▶'} {table.columns.length} {tForms('columns')}
                </span>
              </button>

              {isExpanded && (
                <div className="bg-gray-50 pl-6 pr-3 py-2 space-y-1">
                  {table.columns.map((column) => {
                    const isColumnSelected =
                      selectedTable === table.name && selectedColumn === column;

                    return (
                      <button
                        key={column}
                        type="button"
                        onClick={() => onSelectColumn?.(table.name, column)}
                        className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                          isColumnSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {column}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


