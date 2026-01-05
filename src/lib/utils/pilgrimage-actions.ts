import { Pilgrimage, PilgrimageStatus } from '@/hooks/usePilgrimages';
import { DropdownItem } from '@/components/ui/Dropdown';

export interface PilgrimageActionConfig {
  onView: (id: string) => void;
  onEdit: (pilgrimage: Pilgrimage) => void;
  onApprove: (id: string) => void;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  translations: {
    view: string;
    edit: string;
    approve: string;
    publish: string;
    close: string;
    cancel: string;
    delete: string;
  };
}

/**
 * Generate action items for pilgrimage dropdown menu based on status
 * Returns appropriate actions based on the pilgrimage's current status
 */
export function getPilgrimageActionItems(
  pilgrimage: Pilgrimage,
  config: PilgrimageActionConfig
): DropdownItem[] {
  const { status } = pilgrimage;
  const { onView, onEdit, onApprove, onPublish, onClose, onCancel, onDelete, translations } = config;

  const actionItems: DropdownItem[] = [
    { label: translations.view, onClick: () => onView(pilgrimage.id) },
    { label: translations.edit, onClick: () => onEdit(pilgrimage) },
  ];

  // Status-specific actions
  if (status === 'draft') {
    actionItems.push({ label: translations.approve, onClick: () => onApprove(pilgrimage.id) });
  }

  if (status === 'draft' || status === 'closed') {
    actionItems.push({ label: translations.publish, onClick: () => onPublish(pilgrimage.id) });
  }

  if (status === 'open') {
    actionItems.push({ label: translations.close, onClick: () => onClose(pilgrimage.id) });
  }

  if (status !== 'cancelled' && status !== 'completed') {
    actionItems.push({
      label: translations.cancel,
      onClick: () => onCancel(pilgrimage.id),
      variant: 'danger' as const,
    });
  }

  // Delete is always available
  actionItems.push({
    label: translations.delete,
    onClick: () => onDelete(pilgrimage.id),
    variant: 'danger' as const,
  });

  return actionItems;
}

