/**
 * Utility functions for building event action menus
 */

import { ChurchEvent } from '@/hooks/useEvents';
import { DropdownItem } from '@/components/ui/Dropdown';

export interface EventActionHandlers {
  onEdit: (event: ChurchEvent) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface EventActionTranslations {
  edit: string;
  confirm: string;
  cancel: string;
  delete: string;
}

/**
 * Build action menu items for an event based on its status
 */
export function buildEventActionItems(
  event: ChurchEvent,
  handlers: EventActionHandlers,
  translations: EventActionTranslations
): DropdownItem[] {
  const items: DropdownItem[] = [
    { label: translations.edit, onClick: () => handlers.onEdit(event) },
  ];

  // Add confirm action only for pending events
  if (event.status === 'pending') {
    items.push({
      label: translations.confirm,
      onClick: () => handlers.onConfirm(event.id),
    });
  }

  // Add cancel action for events that can be cancelled
  if (event.status !== 'cancelled' && event.status !== 'completed') {
    items.push({
      label: translations.cancel,
      onClick: () => handlers.onCancel(event.id),
      variant: 'danger',
    });
  }

  // Always show delete action
  items.push({
    label: translations.delete,
    onClick: () => handlers.onDelete(event.id),
    variant: 'danger',
  });

  return items;
}


