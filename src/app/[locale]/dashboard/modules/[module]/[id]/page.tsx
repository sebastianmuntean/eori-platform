'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DetailPage() {
  console.log('Step 1: Rendering Detail page');
  
  const params = useParams();
  const moduleName = params.module as string;
  const id = params.id as string;

  console.log('Step 1.1: Module name:', moduleName);
  console.log('Step 1.2: Item ID:', id);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Module', href: `/dashboard/modules/${moduleName}` },
    { label: moduleName.charAt(0).toUpperCase() + moduleName.slice(1), href: `/dashboard/modules/${moduleName}` },
    { label: 'Detalii', href: `/dashboard/modules/${moduleName}/list` },
    { label: id },
  ];

  // Generic detail data - can be replaced with real data later
  const detailData = {
    id,
    name: 'Exemplu',
    status: 'Activ',
    createdAt: new Date().toLocaleDateString('ro-RO'),
    description: 'Aceasta este o pagină generică de detalii. Conținutul real va fi încărcat din API.',
  };

  console.log('✓ Rendering detail page');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-text-primary capitalize">
              Detalii {moduleName}
            </h1>
            <Badge variant="success">{detailData.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Editează</Button>
          <Button variant="danger">Șterge</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">
                Informații Generale
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">ID</label>
                  <p className="text-text-primary">{detailData.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Nume</label>
                  <p className="text-text-primary">{detailData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Status</label>
                  <p className="text-text-primary">{detailData.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Data Creării</label>
                  <p className="text-text-primary">{detailData.createdAt}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Descriere</label>
                  <p className="text-text-primary">{detailData.description}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">
                Acțiuni
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Exportă
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Duplică
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Istoric
                </Button>
              </div>
            </CardBody>
            <CardFooter>
              <p className="text-xs text-text-muted">
                Ultima actualizare: {detailData.createdAt}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

