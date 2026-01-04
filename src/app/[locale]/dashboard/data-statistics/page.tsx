'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface DataStatistics {
  entities: {
    parishes: number;
    partners: number;
    clients: number;
    invoices: number;
    payments: number;
    events: number;
    users: number;
    donations: number;
    contracts: number;
    products?: number;
    fixedAssets?: number;
    inventory?: number;
  };
  breakdown: {
    partners: {
      supplier: number;
      client: number;
      both: number;
      other: number;
    };
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
    partnersWithInvoices: number;
    partnersWithPayments: number;
    parishesWithPartners: number;
    parishesWithInvoices: number;
    parishesWithPayments: number;
    parishesWithEvents: number;
    parishesWithContracts: number;
  };
}

export default function DataStatisticsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [showSectionModal, setShowSectionModal] = useState<{
    type: 'partners' | 'clients' | 'invoices' | 'payments' | 'events' | 'contracts' | 'products' | 'fixedAssets' | 'inventory' | null;
    count: number;
  }>({ type: null, count: 10 });
  const [generateConfig, setGenerateConfig] = useState({
    clients: 100,
    suppliers: 20,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
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
      setError('Failed to load statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFakeData = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/statistics/generate-fake-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateConfig),
      });

      const data = await response.json();

      if (data.success) {
        setShowGenerateModal(false);
        // Refresh statistics
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
  };

  const handleOpenSectionModal = (sectionType: 'partners' | 'clients' | 'invoices' | 'payments' | 'events' | 'contracts' | 'products' | 'fixedAssets' | 'inventory') => {
    setShowSectionModal({ type: sectionType, count: 10 });
  };

  const handleGenerateSectionData = async () => {
    if (!showSectionModal.type) return;

    const sectionType = showSectionModal.type;
    const count = showSectionModal.count;

    if (count <= 0) {
      alert('Numărul trebuie să fie mai mare decât 0');
      return;
    }

    try {
      setGeneratingSection(sectionType);
      const requestBody: any = {};
      
      // For partners, generate both clients and suppliers
      if (sectionType === 'partners') {
        requestBody.clients = Math.floor(count * 0.7); // 70% clients
        requestBody.suppliers = Math.floor(count * 0.3); // 30% suppliers
      } else if (sectionType === 'clients') {
        requestBody.clientsCount = count; // Generate clients directly
      } else if (sectionType === 'fixedAssets') {
        requestBody.fixedAssets = count;
      } else {
        requestBody[sectionType] = count;
      }

      const response = await fetch('/api/statistics/generate-fake-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setShowSectionModal({ type: null, count: 10 });
        // Refresh statistics
        await fetchStatistics();
        const sectionName = sectionType === 'clients' ? 'clienți' 
          : sectionType === 'fixedAssets' ? 'mijloace fixe'
          : sectionType === 'products' ? 'produse'
          : sectionType === 'inventory' ? 'inventar'
          : sectionType;
        alert(data.message || `Date ${sectionName} generate cu succes`);
      } else {
        const sectionName = sectionType === 'clients' ? 'clienți'
          : sectionType === 'fixedAssets' ? 'mijloace fixe'
          : sectionType === 'products' ? 'produse'
          : sectionType === 'inventory' ? 'inventar'
          : sectionType;
        alert(data.error || `Eroare la generarea datelor ${sectionName}`);
      }
    } catch (err) {
      alert(`Failed to generate ${sectionType} data`);
      console.error(`Error generating ${sectionType} data:`, err);
    } finally {
      setGeneratingSection(null);
    }
  };

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('dataStatistics') },
  ];

  if (loading) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-6" />
        <div className="text-center py-12">
          <div className="text-text-secondary">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-6" />
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
    <div>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">{t('dataStatistics')}</h1>
        <Button onClick={() => setShowGenerateModal(true)} variant="primary">
          {t('generateFakeData')}
        </Button>
      </div>

      {/* Main Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('parishes')}</p>
                <p className="text-2xl font-bold text-primary">{statistics.entities.parishes}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('parteneri')}</p>
                <p className="text-2xl font-bold text-info">{statistics.entities.partners}</p>
              </div>
              <div className="w-12 h-12 bg-info bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('clients')}</p>
                <p className="text-2xl font-bold text-success">{statistics.entities.clients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('invoices')}</p>
                <p className="text-2xl font-bold text-success">{statistics.entities.invoices}</p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('payments')}</p>
                <p className="text-2xl font-bold text-warning">{statistics.entities.payments}</p>
              </div>
              <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('events')}</p>
                <p className="text-2xl font-bold text-danger">{statistics.entities.events}</p>
              </div>
              <div className="w-12 h-12 bg-danger bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('users')}</p>
                <p className="text-2xl font-bold text-secondary">{statistics.entities.users}</p>
              </div>
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('donations')}</p>
                <p className="text-2xl font-bold text-primary">{statistics.entities.donations}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('contracts')}</p>
                <p className="text-2xl font-bold text-warning">{statistics.entities.contracts}</p>
              </div>
              <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Breakdown by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Partners Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('parteneri')} - {t('byCategory')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('partners')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'partners'}
              >
                {generatingSection === 'partners' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
            </div>
          </CardBody>
        </Card>

        {/* Clients Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('clients')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('clients')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'clients'}
              >
                {generatingSection === 'clients' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">{t('total')}</Badge>
                  <span className="text-sm text-text-secondary">{t('totalClients')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.entities.clients || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Invoices Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('invoices')} - {t('byType')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('invoices')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'invoices'}
              >
                {generatingSection === 'invoices' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">{t('issued')}</Badge>
                  <span className="text-sm text-text-secondary">{t('issuedInvoices')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.invoices.issued}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="sm">{t('received')}</Badge>
                  <span className="text-sm text-text-secondary">{t('receivedInvoices')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.invoices.received}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payments Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('payments')} - {t('byType')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('payments')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'payments'}
              >
                {generatingSection === 'payments' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">{t('income')}</Badge>
                  <span className="text-sm text-text-secondary">{t('income')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.payments.income}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="danger" size="sm">{t('expense')}</Badge>
                  <span className="text-sm text-text-secondary">{t('expense')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.payments.expense}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Events Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('events')} - {t('byType')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('events')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'events'}
              >
                {generatingSection === 'events' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" size="sm">{t('wedding')}</Badge>
                  <span className="text-sm text-text-secondary">{t('wedding')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.events.wedding}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" size="sm">{t('baptism')}</Badge>
                  <span className="text-sm text-text-secondary">{t('baptism')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.events.baptism}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" size="sm">{t('funeral')}</Badge>
                  <span className="text-sm text-text-secondary">{t('funeral')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.events.funeral}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contracts Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('contracts')} - {t('byType')}</h2>
              <Button
                onClick={() => handleOpenSectionModal('contracts')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'contracts'}
              >
                {generatingSection === 'contracts' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="sm">{t('incoming')}</Badge>
                  <span className="text-sm text-text-secondary">{t('incoming')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.contracts.incoming}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="warning" size="sm">{t('outgoing')}</Badge>
                  <span className="text-sm text-text-secondary">{t('outgoing')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.contracts.outgoing}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" size="sm">{t('rental')}</Badge>
                  <span className="text-sm text-text-secondary">{t('rental')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.contracts.rental}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" size="sm">{t('concession')}</Badge>
                  <span className="text-sm text-text-secondary">{t('concession')}</span>
                </div>
                <span className="text-lg font-semibold">{statistics.breakdown.contracts.concession}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Products/Stock Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Produse Stoc</h2>
              <Button
                onClick={() => handleOpenSectionModal('products')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'products'}
              >
                {generatingSection === 'products' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">Total</Badge>
                  <span className="text-sm text-text-secondary">Produse în stoc</span>
                </div>
                <span className="text-lg font-semibold">{statistics.entities.products || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Fixed Assets Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mijloace Fixe</h2>
              <Button
                onClick={() => handleOpenSectionModal('fixedAssets')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'fixedAssets'}
              >
                {generatingSection === 'fixedAssets' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="sm">Total</Badge>
                  <span className="text-sm text-text-secondary">Mijloace fixe</span>
                </div>
                <span className="text-lg font-semibold">{statistics.entities.fixedAssets || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Inventory Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Inventar</h2>
              <Button
                onClick={() => handleOpenSectionModal('inventory')}
                variant="outline"
                size="sm"
                disabled={generatingSection === 'inventory'}
              >
                {generatingSection === 'inventory' ? t('generating') : t('generateFakeData')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Badge variant="warning" size="sm">Total</Badge>
                  <span className="text-sm text-text-secondary">Sesiuni inventar</span>
                </div>
                <span className="text-lg font-semibold">{statistics.entities.inventory || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>
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
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('partnersWithInvoices')}</p>
              <p className="text-2xl font-bold text-primary">{statistics.relationships.partnersWithInvoices}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.partners > 0
                  ? `${Math.round((statistics.relationships.partnersWithInvoices / statistics.entities.partners) * 100)}% ${t('ofPartners')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('partnersWithPayments')}</p>
              <p className="text-2xl font-bold text-info">{statistics.relationships.partnersWithPayments}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.partners > 0
                  ? `${Math.round((statistics.relationships.partnersWithPayments / statistics.entities.partners) * 100)}% ${t('ofPartners')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('parishesWithPartners')}</p>
              <p className="text-2xl font-bold text-success">{statistics.relationships.parishesWithPartners}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.parishes > 0
                  ? `${Math.round((statistics.relationships.parishesWithPartners / statistics.entities.parishes) * 100)}% ${t('ofParishes')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('parishesWithInvoices')}</p>
              <p className="text-2xl font-bold text-warning">{statistics.relationships.parishesWithInvoices}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.parishes > 0
                  ? `${Math.round((statistics.relationships.parishesWithInvoices / statistics.entities.parishes) * 100)}% ${t('ofParishes')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('parishesWithPayments')}</p>
              <p className="text-2xl font-bold text-danger">{statistics.relationships.parishesWithPayments}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.parishes > 0
                  ? `${Math.round((statistics.relationships.parishesWithPayments / statistics.entities.parishes) * 100)}% ${t('ofParishes')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('parishesWithEvents')}</p>
              <p className="text-2xl font-bold text-secondary">{statistics.relationships.parishesWithEvents}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.parishes > 0
                  ? `${Math.round((statistics.relationships.parishesWithEvents / statistics.entities.parishes) * 100)}% ${t('ofParishes')}`
                  : '-'}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary mb-2">{t('parishesWithContracts')}</p>
              <p className="text-2xl font-bold text-warning">{statistics.relationships.parishesWithContracts}</p>
              <p className="text-xs text-text-secondary mt-1">
                {statistics.entities.parishes > 0
                  ? `${Math.round((statistics.relationships.parishesWithContracts / statistics.entities.parishes) * 100)}% ${t('ofParishes')}`
                  : '-'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Generate Fake Data Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title={t('generateFakeData')}
      >
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">
            {t('generateFakeDataDescription')}
          </p>
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
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(false)}
              disabled={generating}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleGenerateFakeData}
              disabled={generating}
            >
              {generating ? t('generating') : t('generate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Section Data Modal */}
      <Modal
        isOpen={showSectionModal.type !== null}
        onClose={() => setShowSectionModal({ type: null, count: 10 })}
        title={showSectionModal.type ? `${t('generateFakeData')} - ${t(showSectionModal.type)}` : t('generateFakeData')}
      >
        <div className="space-y-4">
          <p className="text-text-secondary mb-4">
            {showSectionModal.type === 'partners' && 'Introduceți numărul de parteneri de generat (se vor genera 70% clienți și 30% furnizori)'}
            {showSectionModal.type === 'invoices' && 'Introduceți numărul de facturi de generat'}
            {showSectionModal.type === 'payments' && 'Introduceți numărul de plăți de generat'}
            {showSectionModal.type === 'events' && 'Introduceți numărul de evenimente de generat'}
            {showSectionModal.type === 'contracts' && 'Introduceți numărul de contracte de generat'}
            {showSectionModal.type === 'products' && 'Introduceți numărul de produse de generat (se vor genera și mișcări de stoc)'}
            {showSectionModal.type === 'fixedAssets' && 'Introduceți numărul de mijloace fixe de generat'}
            {showSectionModal.type === 'inventory' && 'Introduceți numărul de sesiuni de inventar de generat'}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              Număr de înregistrări ({t('default')}: 10)
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
            <Button
              onClick={handleGenerateSectionData}
              disabled={generatingSection !== null || showSectionModal.count <= 0}
            >
              {generatingSection ? t('generating') : t('generate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

