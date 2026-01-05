'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCatechesisLessons } from '@/hooks/useCatechesisLessons';
import { useTranslations } from 'next-intl';

interface LessonViewerProps {
  lessonId: string;
  enrollmentId?: string;
  onComplete?: () => void;
  onClose?: () => void;
  className?: string;
}

export function LessonViewer({
  lessonId,
  enrollmentId,
  onComplete,
  onClose,
  className = '',
}: LessonViewerProps) {
  const t = useTranslations('catechesis');
  const { fetchLessonPreview, lessons, fetchLessons } = useCatechesisLessons();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      setError(null);
      startTimeRef.current = new Date();

      try {
        const previewContent = await fetchLessonPreview(lessonId);
        setContent(previewContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId, fetchLessonPreview]);

  const handleComplete = async () => {
    if (enrollmentId && onComplete) {
      // Track completion time
      const timeSpent = startTimeRef.current
        ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 60000)
        : null;

      // Call the completion callback
      onComplete();
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="flex items-center justify-center h-64">
            <div className="text-text-secondary">{t('lessons.loadingLesson')}</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="p-4 bg-danger/10 text-danger rounded-md">
            {error}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('lessons.lessonViewer')}</h2>
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                {t('lessons.close')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="flex-1 p-0 overflow-hidden">
          <div className="h-full relative">
            <iframe
              ref={iframeRef}
              srcDoc={content || `<p>${t('lessons.noContentAvailable')}</p>`}
              className="w-full h-full border-0"
              title={t('lessons.lessonViewer')}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              style={{ minHeight: '600px' }}
            />
          </div>
        </CardBody>
        {enrollmentId && (
          <div className="border-t border-border p-4 bg-bg-secondary">
            <div className="flex items-center justify-between">
              <Badge className="bg-success text-white">{t('progress.inProgress')}</Badge>
              <Button variant="primary" onClick={handleComplete}>
                {t('lessons.markAsComplete')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

