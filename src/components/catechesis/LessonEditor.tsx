'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useCatechesisLessons, CatechesisLesson } from '@/hooks/useCatechesisLessons';
import { useTranslations } from 'next-intl';

interface LessonEditorProps {
  lessonId?: string;
  onSave?: (lesson: CatechesisLesson) => void;
  onCancel?: () => void;
  className?: string;
}

export function LessonEditor({
  lessonId,
  onSave,
  onCancel,
  className = '',
}: LessonEditorProps) {
  const t = useTranslations('catechesis');
  const { lessons, fetchLessons, createLesson, updateLesson } = useCatechesisLessons();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || '');
        setContent(lesson.content || '');
        setOrderIndex(lesson.orderIndex);
        setDurationMinutes(lesson.durationMinutes);
        setIsPublished(lesson.isPublished);
      }
    }
  }, [lessonId, lessons]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const lessonData = {
        title,
        description: description || null,
        content: content || null,
        orderIndex,
        durationMinutes,
        isPublished,
      };

      let savedLesson;
      if (lessonId) {
        savedLesson = await updateLesson(lessonId, lessonData);
      } else {
        // Need parishId from context or props
        savedLesson = await createLesson(lessonData as any);
      }

      if (savedLesson && onSave) {
        onSave(savedLesson);
      }
    } catch (err) {
      console.error('Failed to save lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {lessonId ? t('actions.edit') : t('actions.create')} {t('lessons.title')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
            >
              {viewMode === 'edit' ? t('lessons.preview') : t('actions.edit')}
            </Button>
            {onCancel && (
              <Button variant="secondary" size="sm" onClick={onCancel}>
                {t('actions.cancel')}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
              {t('actions.save')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {viewMode === 'edit' ? (
          <div className="space-y-4">
            <Input
              label={t('lessons.name')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label={t('lessons.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('lessons.content')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary font-mono text-sm"
                rows={20}
                placeholder="Enter HTML content..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label={t('lessons.orderIndex')}
                type="number"
                value={orderIndex.toString()}
                onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              />
              <Input
                label={t('lessons.durationMinutes')}
                type="number"
                value={durationMinutes?.toString() || ''}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || null)}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublished" className="text-sm text-text-primary">
                  {t('lessons.isPublished')}
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <iframe
              srcDoc={content || '<p>No content available</p>'}
              className="w-full"
              style={{ minHeight: '600px' }}
              title="Lesson Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}


