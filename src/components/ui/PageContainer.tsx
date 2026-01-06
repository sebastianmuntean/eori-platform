import { cn } from '@/lib/utils';
import React from 'react';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Page container component that provides consistent spacing
 * for page content across all dashboard pages.
 * 
 * @example
 * <PageContainer>
 *   <PageHeader ... />
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </PageContainer>
 */
export function PageContainer({ 
  children, 
  className,
  ...props 
}: PageContainerProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

