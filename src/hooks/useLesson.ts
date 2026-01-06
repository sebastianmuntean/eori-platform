'use client';

import { useState, useEffect } from 'react';
import { useCatechesisLessons, CatechesisLesson } from './useCatechesisLessons';

interface UseLessonReturn {
  lesson: CatechesisLesson | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch a single lesson by ID
 * Uses the dedicated API endpoint for better performance
 */
export function useLesson(lessonId: string | null): UseLessonReturn {
  const { fetchLessonById, error: hookError, loading: hookLoading } = useCatechesisLessons();
  const [lesson, setLesson] = useState<CatechesisLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = async () => {
    if (!lessonId) {
      setLesson(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchedLesson = await fetchLessonById(lessonId);
    
    if (fetchedLesson) {
      setLesson(fetchedLesson);
    } else {
      setError(hookError || 'Lesson not found');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  return {
    lesson,
    loading: loading || hookLoading,
    error: error || hookError,
    refetch: fetchLesson,
  };
}






