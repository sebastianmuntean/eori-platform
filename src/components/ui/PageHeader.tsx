import { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  action?: ReactNode;
  description?: string;
  className?: string;
}

/**
 * Global page header component that provides consistent styling
 * for page headers with breadcrumbs, title, and optional action button.
 * 
 * @example
 * <PageHeader
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Warehouses' }
 *   ]}
 *   title="Warehouses"
 *   action={<Button onClick={handleAdd}>Add</Button>}
 * />
 */
export function PageHeader({
  breadcrumbs,
  title,
  action,
  description,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold text-text-primary mt-2">{title}</h1>
        {description && (
          <p className="text-text-secondary mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

