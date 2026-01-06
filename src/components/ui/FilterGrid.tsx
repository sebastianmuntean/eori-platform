'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from './Input';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGridProps {
  children?: React.ReactNode;
  className?: string;
}

export interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

export interface FilterDateProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export interface FilterClearProps {
  onClear: () => void;
  className?: string;
}

export interface ParishFilterProps {
  value: string;
  onChange: (value: string) => void;
  parishes: Array<{ id: string; name: string }>;
  className?: string;
}

export interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  statuses: FilterOption[];
  className?: string;
}

export interface TypeFilterProps {
  value: string;
  onChange: (value: string) => void;
  types: FilterOption[];
  className?: string;
}

export interface ClientFilterProps {
  value: string;
  onChange: (value: string) => void;
  clients: Array<{ id: string; companyName?: string | null; firstName?: string | null; lastName?: string | null; code: string }>;
  className?: string;
}

export function FilterGrid({ children, className }: FilterGridProps) {
  return (
    <div className={`flex flex-wrap items-end gap-4 ${className || ''}`}>
      {children}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, placeholder, className }: FilterSelectProps) {
  const t = useTranslations('common');
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded bg-bg-primary text-text-primary"
      >
        <option value="">{placeholder || t('allTypes')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterDate({ label, value, onChange, className }: FilterDateProps) {
  const t = useTranslations('common');
  
  return (
    <div className={`flex-1 min-w-[180px] ${className || ''}`}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

export function FilterClear({ onClear, className }: FilterClearProps) {
  const t = useTranslations('common');
  
  return (
    <div className={`${className || ''}`}>
      <label className="block text-sm font-medium mb-1 opacity-0 pointer-events-none">{t('clear')}</label>
      <button
        type="button"
        onClick={onClear}
        className="px-4 py-2 text-sm border rounded hover:bg-bg-secondary transition-colors text-text-primary whitespace-nowrap"
      >
        {t('clear')}
      </button>
    </div>
  );
}

export function ParishFilter({ value, onChange, parishes, className }: ParishFilterProps) {
  const t = useTranslations('common');
  
  return (
    <FilterSelect
      label={t('parish')}
      value={value}
      onChange={onChange}
      options={parishes.map(p => ({ value: p.id, label: p.name }))}
      placeholder={t('allParishes')}
      className={className}
    />
  );
}

export function StatusFilter({ value, onChange, statuses, className }: StatusFilterProps) {
  const t = useTranslations('common');
  
  return (
    <FilterSelect
      label={t('status')}
      value={value}
      onChange={onChange}
      options={statuses}
      placeholder={t('allStatuses')}
      className={className}
    />
  );
}

export function TypeFilter({ value, onChange, types, className }: TypeFilterProps) {
  const t = useTranslations('common');
  
  return (
    <FilterSelect
      label={t('type')}
      value={value}
      onChange={onChange}
      options={types}
      placeholder={t('allTypes')}
      className={className}
    />
  );
}

export function ClientFilter({ value, onChange, clients, className }: ClientFilterProps) {
  const t = useTranslations('common');
  
  const getClientDisplayName = (client: ClientFilterProps['clients'][0]) => {
    return client.companyName || 
           `${client.firstName || ''} ${client.lastName || ''}`.trim() || 
           client.code;
  };
  
  return (
    <FilterSelect
      label={t('clients')}
      value={value}
      onChange={onChange}
      options={clients.map(c => ({ value: c.id, label: getClientDisplayName(c) }))}
      placeholder={t('allTypes')}
      className={className}
    />
  );
}

