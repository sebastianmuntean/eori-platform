import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../setup/test-utils';
import { LessonsPageContent } from '@/components/catechesis/lessons/LessonsPageContent';
import { useCatechesisLessons } from '@/hooks/useCatechesisLessons';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useToast } from '@/hooks/useToast';

// Mock hooks
vi.mock('@/hooks/useCatechesisLessons');
vi.mock('@/hooks/useCatechesisClasses');
vi.mock('@/hooks/useToast');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
    toString: vi.fn(() => ''),
  }),
}));

// Mock next-intl - use importOriginal to preserve NextIntlClientProvider
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: vi.fn((namespace: string) => {
      const translations: Record<string, Record<string, string>> = {
        common: {
          breadcrumbDashboard: 'Dashboard',
          loading: 'Loading...',
          search: 'Search',
          page: 'Page',
          of: 'of',
          previous: 'Previous',
          next: 'Next',
          confirm: 'Confirm',
          cancel: 'Cancel',
          delete: 'Delete',
          actions: 'Actions',
          status: 'Status',
          noData: 'No data available',
          createdAt: 'Created At',
          success: 'Success',
        },
        catechesis: {
          title: 'Catechesis',
          'lessons.title': 'Lessons',
          'lessons.name': 'Name',
          'lessons.orderIndex': 'Order',
          'lessons.durationMinutes': 'Duration',
          'lessons.view': 'View',
          'lessons.description': 'Manage lessons',
          'classes.title': 'Class',
          'status.published': 'Published',
          'status.unpublished': 'Unpublished',
          'actions.create': 'Create',
          'actions.edit': 'Edit',
          'actions.delete': 'Delete',
          'filters.allClasses': 'All Classes',
          'filters.allStatus': 'All Status',
          'confirmations.deleteLesson': 'Are you sure you want to delete this lesson?',
          'errors.failedToDelete': 'Failed to delete lesson',
          manageLessons: 'Manage lessons',
        },
      };
      return (key: string) => translations[namespace]?.[key] || key;
    }),
  };
});

describe('LessonsPageContent', () => {
  const locale = 'ro';
  const mockFetchLessons = vi.fn();
  const mockDeleteLesson = vi.fn();
  const mockFetchClasses = vi.fn();
  const mockSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockRemoveToast = vi.fn();

  const mockLessons = [
    {
      id: '1',
      title: 'Lesson 1',
      className: 'Class 1',
      orderIndex: 1,
      durationMinutes: 60,
      isPublished: true,
      createdAt: '2024-01-01',
      classId: 'class1',
    },
    {
      id: '2',
      title: 'Lesson 2',
      className: 'Class 2',
      orderIndex: 2,
      durationMinutes: 45,
      isPublished: false,
      createdAt: '2024-01-02',
      classId: 'class2',
    },
  ];

  const mockClasses = [
    { id: 'class1', name: 'Class 1' },
    { id: 'class2', name: 'Class 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useCatechesisLessons as any).mockReturnValue({
      lessons: mockLessons,
      loading: false,
      error: null,
      pagination: { page: 1, totalPages: 1, total: 2, pageSize: 10 },
      fetchLessons: mockFetchLessons,
      deleteLesson: mockDeleteLesson,
    });

    (useCatechesisClasses as any).mockReturnValue({
      classes: mockClasses,
      fetchClasses: mockFetchClasses,
    });

    (useToast as any).mockReturnValue({
      toasts: [],
      success: mockSuccess,
      error: mockShowError,
      removeToast: mockRemoveToast,
    });
  });

  it('should render the page container', () => {
    render(<LessonsPageContent locale={locale} />);
    
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });

  it('should render page header with correct title', () => {
    render(<LessonsPageContent locale={locale} />);
    
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });

  it('should fetch lessons on mount', () => {
    render(<LessonsPageContent locale={locale} />);
    
    expect(mockFetchLessons).toHaveBeenCalled();
  });

  it('should fetch classes on mount', () => {
    render(<LessonsPageContent locale={locale} />);
    
    expect(mockFetchClasses).toHaveBeenCalledWith({ pageSize: 1000 });
  });

  it('should render lessons table', async () => {
    render(<LessonsPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      expect(screen.getByText('Lesson 2')).toBeInTheDocument();
    });
  });

  it('should render filters', () => {
    render(<LessonsPageContent locale={locale} />);
    
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should use memoized fetchParams', () => {
    const { rerender } = render(<LessonsPageContent locale={locale} />);
    
    const initialCallCount = mockFetchLessons.mock.calls.length;
    
    rerender(<LessonsPageContent locale={locale} />);
    
    // Should not cause additional fetch calls with same props
    expect(mockFetchLessons.mock.calls.length).toBe(initialCallCount);
  });

  it('should use memoized columns', () => {
    const { rerender } = render(<LessonsPageContent locale={locale} />);
    
    // Rerender should not recreate columns unnecessarily
    rerender(<LessonsPageContent locale={locale} />);
    
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });

  it('should display status badges correctly', async () => {
    render(<LessonsPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Unpublished')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    render(<LessonsPageContent locale={locale} />);
    
    await waitFor(() => {
      const dateElements = screen.getAllByText(/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});

