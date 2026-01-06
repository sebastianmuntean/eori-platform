import Link from 'next/link';
import React from 'react';
import { Card, CardBody } from './Card';

export interface NavigationSubItem {
  title: string;
  href: string;
}

export interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  subItems?: NavigationSubItem[];
}

interface NavigationCardProps {
  item: NavigationItem;
}

export function NavigationCard({ item }: NavigationCardProps) {
  return (
    <Card variant="elevated" className="hover:shadow-lg transition-shadow">
      <Link href={item.href}>
        <CardBody className="cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="text-primary flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.description}</p>
              {item.subItems && item.subItems.length > 0 && (
                <NavigationSubItems items={item.subItems} />
              )}
            </div>
          </div>
        </CardBody>
      </Link>
    </Card>
  );
}

interface NavigationSubItemsProps {
  items: NavigationSubItem[];
}

function NavigationSubItems({ items }: NavigationSubItemsProps) {
  return (
    <div className="mt-3 space-y-1">
      {items.map((subItem, index) => (
        <Link
          key={index}
          href={subItem.href}
          className="block text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          • {subItem.title}
        </Link>
      ))}
    </div>
  );
}

