'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

interface CalendarEvent {
  id: string;
  type: 'wedding' | 'baptism' | 'funeral';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  eventDate: string | null;
  location: string | null;
  priestName: string | null;
  parishId: string;
}

interface EventCalendarProps {
  onEventClick?: (event: CalendarEvent) => void;
  parishId?: string;
  type?: 'wedding' | 'baptism' | 'funeral';
}

const getEventTypeLabels = (t: any): Record<'wedding' | 'baptism' | 'funeral', string> => ({
  wedding: t('wedding'),
  baptism: t('baptism'),
  funeral: t('funeral'),
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

const getStatusLabels = (t: any): Record<
  'pending' | 'confirmed' | 'completed' | 'cancelled',
  string
> => ({
  pending: t('pending'),
  confirmed: t('confirmed'),
  completed: t('completed'),
  cancelled: t('cancelled'),
});

export function EventCalendar({ onEventClick, parishId, type }: EventCalendarProps) {
  const t = useTranslations('common');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const eventTypeLabels = getEventTypeLabels(t);
  const statusLabels = getStatusLabels(t);

  const getMonthStart = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }, []);

  const getMonthEnd = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }, []);

  const getWeekStart = useCallback((date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }, []);

  const getWeekEnd = useCallback((date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  }, [getWeekStart]);

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = view === 'month' ? getMonthStart(currentDate) : getWeekStart(currentDate);
      const endDate = view === 'month' ? getMonthEnd(currentDate) : getWeekEnd(currentDate);

      const params = new URLSearchParams({
        start: formatDateForAPI(startDate),
        end: formatDateForAPI(endDate),
      });

      if (parishId) {
        params.append('parishId', parishId);
      }

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/events/calendar?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch calendar events');
      }

      setEvents(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendar events';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, parishId, type, getMonthStart, getMonthEnd, getWeekStart, getWeekEnd]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString(navigator.language || 'ro-RO', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  };

  const getWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    return `${start.toLocaleDateString(navigator.language || 'ro-RO', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(navigator.language || 'ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Convert Sunday (0) to 6
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateForAPI(date);
    return events.filter((event) => event.eventDate === dateStr);
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    const dayNames = [t('dayShortMon'), t('dayShortTue'), t('dayShortWed'), t('dayShortThu'), t('dayShortFri'), t('dayShortSat'), t('dayShortSun')];

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-text-secondary text-sm">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[100px] border border-border bg-bg-secondary" />;
          }

          const dateEvents = getEventsForDate(date);
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={date.toISOString()}
              className={`min-h-[100px] border border-border p-2 ${
                isToday ? 'bg-primary/10 border-primary' : 'bg-bg-primary'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dateEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: event.type === 'wedding' ? '#fef3c7' : event.type === 'baptism' ? '#dbeafe' : '#fce7f3',
                    }}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="font-medium truncate">{eventTypeLabels[event.type]}</div>
                    <Badge variant={statusVariants[event.status]} size="sm" className="text-xs">
                      {statusLabels[event.status]}
                    </Badge>
                  </div>
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-xs text-text-secondary">
                    +{dateEvents.length - 3} {t('moreEvents')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const start = getWeekStart(currentDate);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }

    const dayNames = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];

    return (
      <div className="space-y-4">
        {days.map((date, index) => {
          const dateEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={date.toISOString()}
              className={`border rounded-lg p-4 ${
                isToday ? 'border-primary bg-primary/5' : 'border-border bg-bg-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-lg">{dayNames[index]}</div>
                  <div className={`text-sm ${isToday ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                    {date.toLocaleDateString(navigator.language || 'ro-RO', { day: 'numeric', month: 'long' })}
                  </div>
                </div>
                {dateEvents.length > 0 && (
                  <Badge variant="secondary" size="sm">
                    {dateEvents.length} {dateEvents.length !== 1 ? t('eventEventsPlural') : t('eventEvents')}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {dateEvents.length === 0 ? (
                  <div className="text-sm text-text-secondary text-center py-4">
                    {t('noEvents')}
                  </div>
                ) : (
                  dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-border rounded-lg hover:bg-bg-secondary cursor-pointer transition-colors"
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{eventTypeLabels[event.type]}</div>
                          {event.location && (
                            <div className="text-sm text-text-secondary mt-1">📍 {event.location}</div>
                          )}
                          {event.priestName && (
                            <div className="text-sm text-text-secondary">👤 {event.priestName}</div>
                          )}
                        </div>
                        <Badge variant={statusVariants[event.status]} size="sm">
                          {statusLabels[event.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {view === 'month' ? getMonthName(currentDate) : getWeekRange(currentDate)}
            </h2>
            <div className="flex gap-2">
              <Button
                variant={view === 'month' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                {t('month')}
              </Button>
              <Button
                variant={view === 'week' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                {t('week')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              {t('today')}
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="text-danger mb-4 p-3 bg-danger/10 rounded-lg">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">{t('loading')}</div>
        ) : (
          <div>{view === 'month' ? renderMonthView() : renderWeekView()}</div>
        )}
      </CardBody>
    </Card>
  );
}

