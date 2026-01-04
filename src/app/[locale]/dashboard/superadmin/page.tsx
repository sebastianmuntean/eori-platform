'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function SuperadminPage() {
  console.log('Step 1: Rendering Superadmin overview page');

  const [stats, setStats] = useState({
    roles: 0,
    permissions: 0,
    users: 0,
    emailTemplates: 0,
  });
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    console.log('Step 2: Fetching statistics');
    setStatsLoading(true);
    setStatsError(null);

    Promise.all([
      fetch('/api/superadmin/roles')
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`Failed to fetch roles: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.error || 'Failed to load roles');
          }
          return data.data.length;
        })
        .catch((error) => {
          console.error('❌ Error loading roles:', error);
          return 0;
        }),
      fetch('/api/superadmin/permissions')
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`Failed to fetch permissions: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.error || 'Failed to load permissions');
          }
          return data.data.length;
        })
        .catch((error) => {
          console.error('❌ Error loading permissions:', error);
          return 0;
        }),
      fetch('/api/superadmin/user-roles')
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`Failed to fetch user-roles: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.error || 'Failed to load user-roles');
          }
          return data.data.length;
        })
        .catch((error) => {
          console.error('❌ Error loading user-roles:', error);
          return 0;
        }),
      fetch('/api/email-templates?pageSize=1')
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`Failed to fetch email templates: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.error || 'Failed to load email templates');
          }
          return data.pagination?.total || 0;
        })
        .catch((error) => {
          console.error('❌ Error loading email templates:', error);
          return 0;
        }),
    ])
      .then(([roles, permissions, users, emailTemplates]) => {
        setStats({
          roles,
          permissions,
          users,
          emailTemplates,
        });
        console.log('✓ Statistics loaded');
      })
      .catch((error) => {
        console.error('❌ Error loading statistics:', error);
        setStatsError('Failed to load some statistics. Please refresh the page.');
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, []);

  const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Superadmin' }];

  const quickLinks = [
    {
      title: 'Roluri',
      description: 'Gestionare roluri',
      href: '/dashboard/superadmin/roles',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'Permisiuni',
      description: 'Gestionare permisiuni',
      href: '/dashboard/superadmin/permissions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Utilizatori-Roluri',
      description: 'Atribuire roluri utilizatori',
      href: '/dashboard/superadmin/user-roles',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Rol-Permisiuni',
      description: 'Configurare permisiuni pe roluri',
      href: '/dashboard/superadmin/role-permissions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Șabloane Email',
      description: 'Gestionare șabloane email',
      href: '/dashboard/superadmin/email-templates',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  console.log('✓ Rendering superadmin overview');
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      <h1 className="text-3xl font-bold text-text-primary mb-6">Superadmin</h1>

      {statsError && (
        <div className="mb-4 p-4 bg-warning bg-opacity-10 border border-warning rounded-md text-warning">
          {statsError}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Roluri</p>
                <p className="text-2xl font-bold text-text-primary">{stats.roles}</p>
              </div>
              <div className="text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm text-text-secondary mb-1">Total Permisiuni</p>
                <p className="text-2xl font-bold text-text-primary">{stats.permissions}</p>
              </div>
              <div className="text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Utilizatori</p>
                <p className="text-2xl font-bold text-text-primary">{stats.users}</p>
              </div>
              <div className="text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm text-text-secondary mb-1">Total Șabloane Email</p>
                <p className="text-2xl font-bold text-text-primary">{stats.emailTemplates}</p>
              </div>
              <div className="text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-text-primary">Acces Rapid</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary">{link.icon}</div>
                    <h3 className="font-semibold text-text-primary">{link.title}</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

