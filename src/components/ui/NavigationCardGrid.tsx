import React from 'react';
import { cn } from '@/lib/utils';
import { NavigationCard, NavigationItem } from './NavigationCard';

export type { NavigationItem, NavigationSubItem } from './NavigationCard';

interface NavigationCardGridProps {
  items: NavigationItem[];
  className?: string;
}

const defaultGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

export function NavigationCardGrid({ 
  items,
  className 
}: NavigationCardGridProps) {
  return (
    <div className={cn(defaultGridClass, className)}>
      {items.map((item, index) => (
        <NavigationCard key={index} item={item} />
      ))}
    </div>
  );
}

