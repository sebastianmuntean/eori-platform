'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ChurchEvent } from './EventForm';
import { ChurchEventParticipant } from './ParticipantForm';
import { useTranslations } from 'next-intl';

interface EventDetailsModalProps {
  event: ChurchEvent | null;
  participants: ChurchEventParticipant[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: ChurchEventParticipant) => void;
  onDeleteParticipant?: (participantId: string) => Promise<void>;
  parishes: Array<{ id: string; name: string }>;
}

const getEventTypeLabels = (t: any): Record<'wedding' | 'baptism' | 'funeral', string> => ({
  wedding: t('wedding'),
  baptism: t('baptism'),
  funeral: t('funeral'),
});

const getStatusLabels = (t: any): Record<
  'pending' | 'confirmed' | 'completed' | 'cancelled',
  string
> => ({
  pending: t('pending'),
  confirmed: t('confirmed'),
  completed: t('completed'),
  cancelled: t('cancelled'),
});

const statusVariants: Record<
  'pending' | 'confirmed' | 'completed' | 'cancelled',
  'warning' | 'success' | 'info' | 'danger'
> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'danger',
};

const getRoleLabels = (t: any): Record<
  'bride' | 'groom' | 'baptized' | 'deceased' | 'godparent' | 'witness' | 'parent' | 'family_member' | 'other',
  string
> => ({
  bride: t('bride'),
  groom: t('groom'),
  baptized: t('baptized'),
  deceased: t('deceased'),
  godparent: t('godparent'),
  witness: t('witness'),
  parent: t('parent'),
  family_member: t('familyMember'),
  other: t('other'),
});

export function EventDetailsModal({
  event,
  participants,
  isOpen,
  onClose,
  onEdit,
  onAddParticipant,
  onEditParticipant,
  onDeleteParticipant,
  parishes,
}: EventDetailsModalProps) {
  const t = useTranslations('common');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const eventTypeLabels = getEventTypeLabels(t);
  const statusLabels = getStatusLabels(t);
  const roleLabels = getRoleLabels(t);

  if (!event) {
    return null;
  }

  const parishName =
    parishes.find((p) => p.id === event.parishId)?.name || t('unknownParish');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(navigator.language || 'ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!onDeleteParticipant) return;
    if (!confirm(t('confirmDeleteParticipant'))) return;

    setDeletingId(participantId);
    try {
      await onDeleteParticipant(participantId);
    } catch (error) {
      console.error('Error deleting participant:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('eventDetails')} - ${eventTypeLabels[event.type]}`}
      size="full"
    >
      <div className="space-y-6">
        {/* Event Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('eventInformation')}</h3>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  {t('edit')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('parish')}</p>
                <p className="font-medium">{parishName}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('eventType')}</p>
                <p className="font-medium">{eventTypeLabels[event.type]}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('status')}</p>
                <Badge
                  variant={statusVariants[event.status]}
                  size="sm"
                >
                  {statusLabels[event.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">
                  {t('eventDate')}
                </p>
                <p className="font-medium">{formatDate(event.eventDate)}</p>
              </div>
              {event.location && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('location')}</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              )}
              {event.priestName && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">{t('priest')}</p>
                  <p className="font-medium">{event.priestName}</p>
                </div>
              )}
              {event.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-text-secondary mb-1">{t('notes')}</p>
                  <p className="font-medium whitespace-pre-wrap">
                    {event.notes}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('participants')} ({participants.length})
              </h3>
              {onAddParticipant && (
                <Button variant="primary" size="sm" onClick={onAddParticipant}>
                  {t('addParticipant')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {participants.length === 0 ? (
              <p className="text-text-secondary text-center py-4">
                {t('noParticipants')}
              </p>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="border border-border rounded-lg p-4 hover:bg-bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" size="sm">
                            {roleLabels[participant.role]}
                          </Badge>
                          <h4 className="font-semibold">
                            {participant.firstName}{' '}
                            {participant.lastName || ''}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {participant.birthDate && (
                            <div>
                              <span className="text-text-secondary">
                                {t('birthDate')}:{' '}
                              </span>
                              <span>{formatDate(participant.birthDate)}</span>
                            </div>
                          )}
                          {participant.cnp && (
                            <div>
                              <span className="text-text-secondary">CNP: </span>
                              <span>{participant.cnp}</span>
                            </div>
                          )}
                          {participant.phone && (
                            <div>
                              <span className="text-text-secondary">
                                {t('phone')}:{' '}
                              </span>
                              <span>{participant.phone}</span>
                            </div>
                          )}
                          {participant.email && (
                            <div>
                              <span className="text-text-secondary">
                                Email:{' '}
                              </span>
                              <span>{participant.email}</span>
                            </div>
                          )}
                          {participant.address && (
                            <div className="md:col-span-2">
                              <span className="text-text-secondary">
                                {t('address')}:{' '}
                              </span>
                              <span>
                                {participant.address}
                                {participant.city ? `, ${participant.city}` : ''}
                              </span>
                            </div>
                          )}
                          {participant.notes && (
                            <div className="md:col-span-2">
                              <span className="text-text-secondary">
                                {t('notes')}:{' '}
                              </span>
                              <span className="whitespace-pre-wrap">
                                {participant.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {onEditParticipant && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditParticipant(participant)}
                          >
                            {t('edit')}
                          </Button>
                        )}
                        {onDeleteParticipant && participant.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleDeleteParticipant(participant.id!)
                            }
                            isLoading={deletingId === participant.id}
                          >
                            {t('delete')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

