import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  console.log('Step 1: Rendering Card component with variant:', variant);
  
  const baseStyles = 'rounded-lg bg-bg-primary';
  const variantStyles = {
    default: 'border border-border shadow-sm',
    outlined: 'border-2 border-border-dark',
    elevated: 'border border-border shadow-lg',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  console.log('Step 2: Rendering CardHeader');
  return (
    <div
      className={cn('px-6 py-4 border-b border-border', className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: CardBodyProps) {
  console.log('Step 3: Rendering CardBody');
  return (
    <div
      className={cn('px-6 py-4', className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  console.log('Step 4: Rendering CardFooter');
  return (
    <div
      className={cn('px-6 py-4 border-t border-border bg-bg-secondary', className)}
      {...props}
    />
  );
}




