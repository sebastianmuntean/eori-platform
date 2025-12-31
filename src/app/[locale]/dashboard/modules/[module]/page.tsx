'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ModulePage() {
  console.log('Step 1: Rendering Module page');
  
  const params = useParams();
  const moduleName = params.module as string;

  console.log('Step 1.1: Module name:', moduleName);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Module', href: `/dashboard/modules/${moduleName}` },
    { label: moduleName.charAt(0).toUpperCase() + moduleName.slice(1) },
  ];

  console.log('✓ Rendering module page');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary capitalize">
            {moduleName}
          </h1>
        </div>
        <Button>Acțiune Nouă</Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-text-primary">
            Conținut Modul
          </h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12 text-text-secondary">
            <p>Conținutul modulului va fi afișat aici</p>
            <p className="text-sm mt-2">Modul: {moduleName}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

