'use client';

import { useState, useCallback } from 'react';

export type ActivityType = 'liturgy' | 'prayer' | 'visit' | 'meal' | 'transport' | 'accommodation' | 'other';

export interface PilgrimageScheduleItem {
  id: string;
  pilgrimageId: string;
  dayNumber: number | null;
  date: string | null;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  activityType: ActivityType;
  durationMinutes: number | null;
  isOptional: boolean;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UsePilgrimageScheduleReturn {
  schedule: PilgrimageScheduleItem[];
  loading: boolean;
  error: string | null;
  fetchSchedule: (pilgrimageId: string) => Promise<void>;
  addActivity: (pilgrimageId: string, data: Partial<PilgrimageScheduleItem>) => Promise<PilgrimageScheduleItem | null>;
  updateActivity: (pilgrimageId: string, activityId: string, data: Partial<PilgrimageScheduleItem>) => Promise<PilgrimageScheduleItem | null>;
  deleteActivity: (pilgrimageId: string, activityId: string) => Promise<boolean>;
  reorderActivities: (pilgrimageId: string, order: string[]) => Promise<boolean>;
}

export function usePilgrimageSchedule(): UsePilgrimageScheduleReturn {
  const [schedule, setSchedule] = useState<PilgrimageScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async (pilgrimageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/schedule`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule');
      }

      setSchedule(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addActivity = useCallback(async (
    pilgrimageId: string,
    data: Partial<PilgrimageScheduleItem>
  ): Promise<PilgrimageScheduleItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add activity');
      }

      setSchedule((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add activity';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActivity = useCallback(async (
    pilgrimageId: string,
    activityId: string,
    data: Partial<PilgrimageScheduleItem>
  ): Promise<PilgrimageScheduleItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/schedule/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update activity');
      }

      setSchedule((prev) => prev.map((a) => (a.id === activityId ? result.data : a)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteActivity = useCallback(async (
    pilgrimageId: string,
    activityId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/schedule/${activityId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete activity');
      }

      setSchedule((prev) => prev.filter((a) => a.id !== activityId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderActivities = useCallback(async (
    pilgrimageId: string,
    order: string[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Update day numbers based on order
      const updates = order.map((activityId, index) => {
        const activity = schedule.find((a) => a.id === activityId);
        if (activity) {
          return updateActivity(pilgrimageId, activityId, { dayNumber: index + 1 });
        }
        return Promise.resolve(null);
      });

      await Promise.all(updates);
      await fetchSchedule(pilgrimageId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder activities';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [schedule, updateActivity, fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
  };
}



