'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

interface Module {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  category: string;
}

export default function ModulesPage() {
  console.log('Step 1: Rendering Modules page');
  
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('menu');
  
  console.log('Step 1.1: Locale:', locale);
  console.log('Step 1.2: Loading module translations');

  const breadcrumbs = [
    { label: t('dashboard'), href: `/${locale}/dashboard` },
    { label: 'Modules', href: `/${locale}/dashboard/modules` },
  ];

  // Define all modules based on the sidebar structure
  const modules: Module[] = [
    {
      id: 'entities',
      label: t('entities'),
      href: `/${locale}/dashboard/modules/entities`,
      category: t('management'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Manage and organize entities',
    },
    {
      id: 'reports',
      label: t('reports'),
      href: `/${locale}/dashboard/modules/reports`,
      category: t('management'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'View and generate reports',
    },
    {
      id: 'users',
      label: t('users'),
      href: `/${locale}/dashboard/modules/users`,
      category: t('administration'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      description: 'Manage system users',
    },
    {
      id: 'email-templates',
      label: t('emailTemplates'),
      href: `/${locale}/dashboard/modules/email-templates`,
      category: t('administration'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Manage email templates',
    },
    {
      id: 'settings',
      label: t('settings'),
      href: `/${locale}/dashboard/modules/settings`,
      category: t('administration'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Configure system settings',
    },
  ];

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  console.log('Step 2: Grouped modules by category:', Object.keys(modulesByCategory));
  console.log('Step 2.1: Total modules:', modules.length);
  console.log('✓ Modules page data prepared');

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <h1 className="text-3xl font-bold text-text-primary">Modules</h1>
        <p className="text-text-secondary mt-2">Select a module to access its features</p>
      </div>

      {/* Modules grouped by category */}
      <div className="space-y-8">
        {Object.entries(modulesByCategory).map(([category, categoryModules]) => {
          console.log(`Step 3: Rendering category "${category}" with ${categoryModules.length} modules`);
          
          return (
            <div key={category}>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryModules.map((module) => {
                  console.log(`Step 3.1: Rendering module card: ${module.id}`);
                  
                  return (
                    <Link key={module.id} href={module.href}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardBody className="flex flex-col items-center text-center p-6">
                          <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                            {module.icon}
                          </div>
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {module.label}
                          </h3>
                          {module.description && (
                            <p className="text-sm text-text-secondary">
                              {module.description}
                            </p>
                          )}
                          <div className="mt-4 flex items-center text-primary text-sm font-medium">
                            <span>Access module</span>
                            <svg
                              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">About Modules</h2>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">
              Modules are organized sections of the platform that provide specific functionality.
              Each module contains its own set of pages and features. Click on any module card above
              to access its subpages and features.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


