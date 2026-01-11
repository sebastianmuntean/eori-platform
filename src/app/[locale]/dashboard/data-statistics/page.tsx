'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { DATA_STATISTICS_PERMISSIONS } from '@/lib/permissions/dataStatistics';

// Types
type SectionType = 'clients' | 'invoices' | 'payments' | 'events' | 'contracts' | 'products' | 'pangarProducts' | 'fixedAssets' | 'inventory' | 'documents' | 'users';

interface DataStatistics {
  entities: {
    parishes: number;
    clients: number;
    invoices: number;
    payments: number;
    events: number;
    users: number;
    donations: number;
    contracts: number;
    products?: number;
    pangarProducts?: number;
    fixedAssets?: number;
    inventory?: number;
    documents?: number;
  };
  breakdown: {
    invoices: {
      issued: number;
      received: number;
    };
    payments: {
      income: number;
      expense: number;
    };
    events: {
      wedding: number;
      baptism: number;
      funeral: number;
    };
    contracts: {
      incoming: number;
      outgoing: number;
      rental: number;
      concession: number;
      sale_purchase: number;
      loan: number;
      other: number;
    };
  };
  relationships: {
    clientsWithInvoices: number;
    clientsWithPayments: number;
    parishesWithClients: number;
    parishesWithInvoices: number;
    parishesWithPayments: number;
    parishesWithEvents: number;
    parishesWithContracts: number;
  };
}

interface EntityCardConfig {
  key: keyof DataStatistics['entities'];
  labelKey: string;
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  icon: React.ReactElement;
}

interface BreakdownItem {
  key: string;
  labelKey: string;
  variant: 'success' | 'info' | 'danger' | 'warning' | 'secondary' | 'primary';
  value: number;
}

interface SectionConfig {
  type: SectionType;
  titleKey: string;
  description: string;
  deleteMessage: string;
  sectionName: string;
}

// Constants
const SECTION_CONFIGS: Record<SectionType, SectionConfig> = {
  clients: {
    type: 'clients',
    titleKey: 'clients',
    description: 'Introduceți numărul de clienți de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru clienți? Această acțiune este ireversibilă.',
    sectionName: 'clienți',
  },
  invoices: {
    type: 'invoices',
    titleKey: 'invoices',
    description: 'Introduceți numărul de facturi de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru facturi? Această acțiune este ireversibilă.',
    sectionName: 'facturi',
  },
  payments: {
    type: 'payments',
    titleKey: 'payments',
    description: 'Introduceți numărul de plăți de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru plăți? Această acțiune este ireversibilă.',
    sectionName: 'plăți',
  },
  events: {
    type: 'events',
    titleKey: 'events',
    description: 'Introduceți numărul de evenimente de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru evenimente? Această acțiune este ireversibilă.',
    sectionName: 'evenimente',
  },
  contracts: {
    type: 'contracts',
    titleKey: 'contracts',
    description: 'Introduceți numărul de contracte de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru contracte? Această acțiune este ireversibilă.',
    sectionName: 'contracte',
  },
  products: {
    type: 'products',
    titleKey: 'products',
    description: 'Introduceți numărul de produse de generat (se vor genera și mișcări de stoc)',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru produse? Această acțiune este ireversibilă.',
    sectionName: 'produse',
  },
  pangarProducts: {
    type: 'pangarProducts',
    titleKey: 'pangarProducts',
    description: 'Introduceți numărul de produse pangar de generat (se vor genera și mișcări de stoc)',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru produse pangar? Această acțiune este ireversibilă.',
    sectionName: 'produse pangar',
  },
  fixedAssets: {
    type: 'fixedAssets',
    titleKey: 'fixedAssets',
    description: 'Introduceți numărul de mijloace fixe de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru mijloace fixe? Această acțiune este ireversibilă.',
    sectionName: 'mijloace fixe',
  },
  inventory: {
    type: 'inventory',
    titleKey: 'inventory',
    description: 'Introduceți numărul de sesiuni de inventar de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru inventar? Această acțiune este ireversibilă.',
    sectionName: 'inventar',
  },
  documents: {
    type: 'documents',
    titleKey: 'documents',
    description: 'Introduceți numărul de documente registratură de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru documente registratură? Această acțiune este ireversibilă.',
    sectionName: 'documente registratură',
  },
  users: {
    type: 'users',
    titleKey: 'users',
    description: 'Introduceți numărul de utilizatori de generat',
    deleteMessage: 'Sunteți sigur că doriți să ștergeți toate datele fake pentru utilizatori? Această acțiune este ireversibilă.',
    sectionName: 'utilizatori',
  },
};

// Reusable Components
interface EntityCardProps {
  label: string;
  value: number;
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  icon: React.ReactElement;
}

function EntityCard({ label, value, color, icon }: EntityCardProps) {
  const colorStyles = {
    primary: { text: 'text-primary', bg: 'bg-primary bg-opacity-10', icon: 'text-primary' },
    success: { text: 'text-success', bg: 'bg-success bg-opacity-10', icon: 'text-success' },
    info: { text: 'text-info', bg: 'bg-info bg-opacity-10', icon: 'text-info' },
    warning: { text: 'text-warning', bg: 'bg-warning bg-opacity-10', icon: 'text-warning' },
    danger: { text: 'text-danger', bg: 'bg-danger bg-opacity-10', icon: 'text-danger' },
    secondary: { text: 'text-secondary', bg: 'bg-secondary bg-opacity-10', icon: 'text-secondary' },
  };

  const styles = colorStyles[color];

  return (
    <Card variant="elevated">
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">{label}</p>
            <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 ${styles.bg} rounded-lg flex items-center justify-center`}>
            <div className={`w-6 h-6 ${styles.icon}`}>{icon}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

interface BreakdownCardProps {
  title: string;
  items: BreakdownItem[];
  sectionType: SectionType;
  onGenerate: (type: SectionType) => void;
  onDelete: (type: SectionType) => void;
  generating: boolean;
  deleting: boolean;
  t: (key: string) => string;
}

function BreakdownCard({ title, items, sectionType, onGenerate, onDelete, generating, deleting, t }: BreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => onGenerate(sectionType)}
              variant="outline"
              size="sm"
              disabled={generating}
            >
              {generating ? t('generating') : t('generateFakeData')}
            </Button>
            <Button
              onClick={() => onDelete(sectionType)}
              variant="outline"
              size="sm"
              disabled={deleting}
              className="text-danger hover:bg-danger hover:text-white"
            >
              {deleting ? t('deleting') : t('deleteData')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
              <div className="flex items-center gap-3">
                <Badge variant={item.variant} size="sm">{t(item.labelKey)}</Badge>
                <span className="text-sm text-text-secondary">{t(item.labelKey)}</span>
              </div>
              <span className="text-lg font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

interface RelationshipCardProps {
  label: string;
  value: number;
  total: number;
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  percentageLabel: string;
  t: (key: string) => string;
}

function RelationshipCard({ label, value, total, color, percentageLabel, t }: RelationshipCardProps) {
  const percentage = useMemo(() => {
    if (total === 0) return null;
    return Math.round((value / total) * 100);
  }, [value, total]);

  const colorStyles = {
    primary: 'text-primary',
    success: 'text-success',
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-danger',
    secondary: 'text-secondary',
  };

  return (
    <div className="p-4 rounded-md bg-bg-secondary">
      <p className="text-sm text-text-secondary mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorStyles[color]}`}>{value}</p>
      {percentage !== null && (
        <p className="text-xs text-text-secondary mt-1">
          {percentage}% {percentageLabel}
        </p>
      )}
    </div>
  );
}

export default function DataStatisticsPage() {
  const { loading: permissionLoading } = useRequirePermission(DATA_STATISTICS_PERMISSIONS.VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('dataStatistics'));

  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<SectionType | null>(null);
  const [showSectionModal, setShowSectionModal] = useState<{ type: SectionType | null; count: number }>({
    type: null,
    count: 10,
  });
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: SectionType | null }>({ type: null });
  const [deleting, setDeleting] = useState<SectionType | null>(null);
  const [generateConfig, setGenerateConfig] = useState({
    clients: 100,
    suppliers: 20,
  });

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/statistics/data');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      if (data.success) {
        setStatistics(data.data);
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Generate fake data handlers
  const handleGenerateFakeData = useCallback(async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/statistics/generate-fake-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateConfig),
      });

      const data = await response.json();

      if (data.success) {
        setShowGenerateModal(false);
        await fetchStatistics();
        alert(data.message || 'Fake data generated successfully');
      } else {
        alert(data.error || 'Failed to generate fake data');
      }
    } catch (err) {
      alert('Failed to generate fake data');
      console.error('Error generating fake data:', err);
    } finally {
      setGenerating(false);
    }
  }, [generateConfig, fetchStatistics]);

  // Build request body for section data generation
  const buildSectionRequestBody = useCallback((sectionType: SectionType, count: number): Record<string, number> => {
    const requestBody: Record<string, number> = {};

    if (sectionType === 'clients') {
      requestBody.clientsCount = count;
    } else if (sectionType === 'fixedAssets') {
      requestBody.fixedAssets = count;
    } else if (sectionType === 'documents') {
      requestBody.documents = count;
    } else if (sectionType === 'users') {
      requestBody.users = count;
    } else if (sectionType === 'pangarProducts') {
      requestBody.pangarProducts = count;
    } else {
      requestBody[sectionType] = count;
    }

    return requestBody;
  }, []);

  // Get section name for display
  const getSectionName = useCallback((sectionType: SectionType): string => {
    return SECTION_CONFIGS[sectionType]?.sectionName || sectionType;
  }, []);

  const handleOpenSectionModal = useCallback((sectionType: SectionType) => {
    setShowSectionModal({ type: sectionType, count: 10 });
  }, []);

  const handleGenerateSectionData = useCallback(async () => {
    if (!showSectionModal.type) return;

    const { type: sectionType, count } = showSectionModal;

    if (count <= 0) {
      alert(t('numberMustBeGreaterThanZero'));
      return;
    }

    try {
      setGeneratingSection(sectionType);
      const requestBody = buildSectionRequestBody(sectionType, count);

      const response = await fetch('/api/statistics/generate-fake-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setShowSectionModal({ type: null, count: 10 });
        await fetchStatistics();
        const sectionName = getSectionName(sectionType);
        alert(data.message || `Date ${sectionName} generate cu succes`);
      } else {
        const sectionName = getSectionName(sectionType);
        alert(data.error || `Eroare la generarea datelor ${sectionName}`);
      }
    } catch (err) {
      const sectionName = getSectionName(showSectionModal.type);
      alert(`Failed to generate ${sectionName} data`);
      console.error(`Error generating ${showSectionModal.type} data:`, err);
    } finally {
      setGeneratingSection(null);
    }
  }, [showSectionModal, buildSectionRequestBody, getSectionName, fetchStatistics]);

  const handleOpenDeleteModal = useCallback((sectionType: SectionType) => {
    setShowDeleteModal({ type: sectionType });
  }, []);

  const handleDeleteFakeData = useCallback(async () => {
    if (!showDeleteModal.type) return;

    const sectionType = showDeleteModal.type;

    try {
      setDeleting(sectionType);
      const response = await fetch(`/api/statistics/delete-fake-data?type=${sectionType}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal({ type: null });
        await fetchStatistics();
        const sectionName = getSectionName(sectionType);
        alert(data.message || `Date ${sectionName} șterse cu succes`);
      } else {
        const sectionName = getSectionName(sectionType);
        alert(data.error || `Eroare la ștergerea datelor ${sectionName}`);
      }
    } catch (err) {
      const sectionName = getSectionName(sectionType);
      alert(`Failed to delete ${sectionName} data`);
      console.error(`Error deleting ${sectionType} data:`, err);
    } finally {
      setDeleting(null);
    }
  }, [showDeleteModal, getSectionName, fetchStatistics]);

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: t('dataStatistics') },
    ],
    [locale, t]
  );

  // Memoized entity cards configuration
  const entityCards = useMemo((): EntityCardConfig[] => {
    if (!statistics) return [];

    return [
      {
        key: 'parishes',
        labelKey: 'parishes',
        color: 'primary',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        key: 'clients',
        labelKey: 'clients',
        color: 'info',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        key: 'invoices',
        labelKey: 'invoices',
        color: 'success',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        key: 'payments',
        labelKey: 'payments',
        color: 'warning',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: 'events',
        labelKey: 'events',
        color: 'danger',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        key: 'users',
        labelKey: 'users',
        color: 'secondary',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        key: 'donations',
        labelKey: 'donations',
        color: 'primary',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
      },
      {
        key: 'contracts',
        labelKey: 'contracts',
        color: 'warning',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ];
  }, [statistics]);

  // Memoized breakdown cards data
  const breakdownCards = useMemo(() => {
    if (!statistics) return [];

    return [
      {
        title: t('clients'),
        sectionType: 'clients' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'success' as const,
            value: statistics.entities.clients || 0,
          },
        ],
      },
      {
        title: `${t('invoices')} - ${t('byType')}`,
        sectionType: 'invoices' as SectionType,
        items: [
          {
            key: 'issued',
            labelKey: 'issued',
            variant: 'success' as const,
            value: statistics.breakdown.invoices.issued,
          },
          {
            key: 'received',
            labelKey: 'received',
            variant: 'info' as const,
            value: statistics.breakdown.invoices.received,
          },
        ],
      },
      {
        title: `${t('payments')} - ${t('byType')}`,
        sectionType: 'payments' as SectionType,
        items: [
          {
            key: 'income',
            labelKey: 'income',
            variant: 'success' as const,
            value: statistics.breakdown.payments.income,
          },
          {
            key: 'expense',
            labelKey: 'expense',
            variant: 'danger' as const,
            value: statistics.breakdown.payments.expense,
          },
        ],
      },
      {
        title: `${t('events')} - ${t('byType')}`,
        sectionType: 'events' as SectionType,
        items: [
          {
            key: 'wedding',
            labelKey: 'wedding',
            variant: 'secondary' as const,
            value: statistics.breakdown.events.wedding,
          },
          {
            key: 'baptism',
            labelKey: 'baptism',
            variant: 'secondary' as const,
            value: statistics.breakdown.events.baptism,
          },
          {
            key: 'funeral',
            labelKey: 'funeral',
            variant: 'secondary' as const,
            value: statistics.breakdown.events.funeral,
          },
        ],
      },
      {
        title: `${t('contracts')} - ${t('byType')}`,
        sectionType: 'contracts' as SectionType,
        items: [
          {
            key: 'incoming',
            labelKey: 'incoming',
            variant: 'info' as const,
            value: statistics.breakdown.contracts.incoming,
          },
          {
            key: 'outgoing',
            labelKey: 'outgoing',
            variant: 'warning' as const,
            value: statistics.breakdown.contracts.outgoing,
          },
          {
            key: 'rental',
            labelKey: 'rental',
            variant: 'secondary' as const,
            value: statistics.breakdown.contracts.rental,
          },
          {
            key: 'concession',
            labelKey: 'concession',
            variant: 'secondary' as const,
            value: statistics.breakdown.contracts.concession,
          },
        ],
      },
      {
        title: t('stockProducts'),
        sectionType: 'products' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'success' as const,
            value: statistics.entities.products || 0,
          },
        ],
      },
      {
        title: t('pangarProducts'),
        sectionType: 'pangarProducts' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'warning' as const,
            value: statistics.entities.pangarProducts || 0,
          },
        ],
      },
      {
        title: t('fixedAssets'),
        sectionType: 'fixedAssets' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'info' as const,
            value: statistics.entities.fixedAssets || 0,
          },
        ],
      },
      {
        title: t('inventory'),
        sectionType: 'inventory' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'warning' as const,
            value: statistics.entities.inventory || 0,
          },
        ],
      },
      {
        title: t('registraturaDocuments'),
        sectionType: 'documents' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'secondary' as const,
            value: statistics.entities.documents || 0,
          },
        ],
      },
      {
        title: t('users'),
        sectionType: 'users' as SectionType,
        items: [
          {
            key: 'total',
            labelKey: 'total',
            variant: 'primary' as const,
            value: statistics.entities.users || 0,
          },
        ],
      },
    ];
  }, [statistics, t]);

  // Memoized relationship cards
  const relationshipCards = useMemo(() => {
    if (!statistics) return [];

    const totalClients = statistics.entities.clients || 0;

    return [
      {
        label: t('clientsWithInvoices'),
        value: statistics.relationships.clientsWithInvoices,
        total: totalClients,
        color: 'primary' as const,
        percentageLabel: t('ofClients'),
      },
      {
        label: t('clientsWithPayments'),
        value: statistics.relationships.clientsWithPayments,
        total: totalClients,
        color: 'info' as const,
        percentageLabel: t('ofClients'),
      },
      {
        label: t('parishesWithClients'),
        value: statistics.relationships.parishesWithClients,
        total: statistics.entities.parishes,
        color: 'success' as const,
        percentageLabel: t('ofParishes'),
      },
      {
        label: t('parishesWithInvoices'),
        value: statistics.relationships.parishesWithInvoices,
        total: statistics.entities.parishes,
        color: 'warning' as const,
        percentageLabel: t('ofParishes'),
      },
      {
        label: t('parishesWithPayments'),
        value: statistics.relationships.parishesWithPayments,
        total: statistics.entities.parishes,
        color: 'danger' as const,
        percentageLabel: t('ofParishes'),
      },
      {
        label: t('parishesWithEvents'),
        value: statistics.relationships.parishesWithEvents,
        total: statistics.entities.parishes,
        color: 'secondary' as const,
        percentageLabel: t('ofParishes'),
      },
      {
        label: t('parishesWithContracts'),
        value: statistics.relationships.parishesWithContracts,
        total: statistics.entities.parishes,
        color: 'warning' as const,
        percentageLabel: t('ofParishes'),
      },
    ];
  }, [statistics, t]);

  // Get current section config
  const currentSectionConfig = useMemo(() => {
    if (!showSectionModal.type) return null;
    return SECTION_CONFIGS[showSectionModal.type];
  }, [showSectionModal.type]);

  const currentDeleteConfig = useMemo(() => {
    if (!showDeleteModal.type) return null;
    return SECTION_CONFIGS[showDeleteModal.type];
  }, [showDeleteModal.type]);

  // Early returns
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          breadcrumbs={breadcrumbs}
          title={t('dataStatistics') || 'Data Statistics'}
          className="mb-6"
        />
        <div className="text-center py-12">
          <div className="text-text-secondary">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          breadcrumbs={breadcrumbs}
          title={t('dataStatistics') || 'Data Statistics'}
          className="mb-6"
        />
        <Card>
          <CardBody>
            <div className="text-red-500">{error}</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('dataStatistics') || 'Data Statistics'}
        action={
          <Button onClick={() => setShowGenerateModal(true)} variant="primary">
            {t('generateFakeData')}
          </Button>
        }
        className="mb-6"
      />

      {/* Main Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {entityCards.map((card) => {
          const value = statistics.entities[card.key] ?? 0;
          return (
            <EntityCard
              key={card.key}
              label={t(card.labelKey)}
              value={value}
              color={card.color}
              icon={card.icon}
            />
          );
        })}
      </div>

      {/* Breakdown by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {breakdownCards.map((card) => (
          <BreakdownCard
            key={card.sectionType}
            title={card.title}
            items={card.items}
            sectionType={card.sectionType}
            onGenerate={handleOpenSectionModal}
            onDelete={handleOpenDeleteModal}
            generating={generatingSection === card.sectionType}
            deleting={deleting === card.sectionType}
            t={t}
          />
        ))}
      </div>

      {/* Relationships */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('relationships')}</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationshipCards.map((card, index) => (
              <RelationshipCard
                key={index}
                label={card.label}
                value={card.value}
                total={card.total}
                color={card.color}
                percentageLabel={card.percentageLabel}
                t={t}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Generate Fake Data Modal */}
      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title={t('generateFakeData')}>
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">{t('generateFakeDataDescription')}</p>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('clients')} ({t('default')}: 100)
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              value={generateConfig.clients}
              onChange={(e) =>
                setGenerateConfig({
                  ...generateConfig,
                  clients: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('suppliers')} ({t('default')}: 20)
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={generateConfig.suppliers}
              onChange={(e) =>
                setGenerateConfig({
                  ...generateConfig,
                  suppliers: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)} disabled={generating}>
              {t('cancel')}
            </Button>
            <Button onClick={handleGenerateFakeData} disabled={generating}>
              {generating ? t('generating') : t('generate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Section Data Modal */}
      <Modal
        isOpen={showSectionModal.type !== null}
        onClose={() => setShowSectionModal({ type: null, count: 10 })}
        title={currentSectionConfig ? `${t('generateFakeData')} - ${t(currentSectionConfig.titleKey)}` : t('generateFakeData')}
      >
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">{currentSectionConfig?.description || ''}</p>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('numberOfRecords')} ({t('default')}: 10)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={showSectionModal.count}
              onChange={(e) =>
                setShowSectionModal({
                  ...showSectionModal,
                  count: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border rounded"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSectionModal({ type: null, count: 10 })}
              disabled={generatingSection !== null}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleGenerateSectionData} disabled={generatingSection !== null || showSectionModal.count <= 0}>
              {generatingSection ? t('generating') : t('generate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal.type !== null}
        onClose={() => setShowDeleteModal({ type: null })}
        title={t('confirmDeleteData')}
      >
        <div className="space-y-4">
          <div className="bg-danger bg-opacity-10 border border-danger rounded-lg p-4">
            <p className="text-danger font-semibold mb-2">⚠️ {t('attention')}</p>
            <p className="text-text-secondary">{currentDeleteConfig?.deleteMessage || ''}</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal({ type: null })} disabled={deleting !== null}>
              {t('cancel')}
            </Button>
            <Button onClick={handleDeleteFakeData} disabled={deleting !== null} variant="danger">
              {deleting ? t('deleting') : t('yesDeleteData')}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}