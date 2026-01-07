import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../setup/test-utils';
import { BaptismsPageContent } from '@/components/events/BaptismsPageContent';
import { useEvents } from '@/hooks/useEvents';
import { useParishes } from '@/hooks/useParishes';

// Mock hooks
vi.mock('@/hooks/useEvents');
vi.mock('@/hooks/useParishes');

const mockUseEvents = vi.mocked(useEvents);
const mockUseParishes = vi.mocked(useParishes);

describe('BaptismsPageContent', () => {
  const mockFetchEvents = vi.fn();
  const mockCreateEvent = vi.fn();
  const mockUpdateEvent = vi.fn();
  const mockDeleteEvent = vi.fn();
  const mockConfirmEvent = vi.fn();
  const mockCancelEvent = vi.fn();
  const mockFetchParishes = vi.fn();

  const mockEvents = [
    {
      id: '1',
      parishId: 'parish-1',
      type: 'baptism' as const,
      status: 'pending' as const,
      eventDate: '2024-01-15',
      location: 'Church',
      priestName: 'Father John',
      notes: 'Test notes',
    },
  ];

  const mockParishes = [
    { id: 'parish-1', name: 'Parish 1' },
    { id: 'parish-2', name: 'Parish 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseEvents.mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      fetchEvents: mockFetchEvents,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
      confirmEvent: mockConfirmEvent,
      cancelEvent: mockCancelEvent,
    });

    mockUseParishes.mockReturnValue({
      parishes: mockParishes,
      loading: false,
      error: null,
      fetchParishes: mockFetchParishes,
      createParish: vi.fn(),
      updateParish: vi.fn(),
      deleteParish: vi.fn(),
    });
  });

  describe('Initial Render', () => {
    it('should render page header with correct title', () => {
      render(<BaptismsPageContent locale="en" />);

      expect(screen.getByText('Baptisms')).toBeInTheDocument();
    });

    it('should render filters section', () => {
      render(<BaptismsPageContent locale="en" />);

      // Filters are rendered via BaptismsFiltersCard
      expect(mockFetchParishes).toHaveBeenCalled();
    });

    it('should fetch parishes on mount', () => {
      render(<BaptismsPageContent locale="en" />);

      expect(mockFetchParishes).toHaveBeenCalledWith({ all: true });
    });

    it('should fetch baptisms events on mount', () => {
      render(<BaptismsPageContent locale="en" />);

      expect(mockFetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'baptism',
          page: 1,
          pageSize: 10,
          sortBy: 'eventDate',
          sortOrder: 'desc',
        })
      );
    });
  });

  describe('Data Fetching', () => {
    it('should filter events by baptism type', () => {
      render(<BaptismsPageContent locale="en" />);

      expect(mockFetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'baptism',
        })
      );
    });
  });

  describe('Loading States', () => {
    it('should handle loading state', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        loading: true,
        error: null,
        pagination: null,
        fetchEvents: mockFetchEvents,
        createEvent: mockCreateEvent,
        updateEvent: mockUpdateEvent,
        deleteEvent: mockDeleteEvent,
        confirmEvent: mockConfirmEvent,
        cancelEvent: mockCancelEvent,
      });

      render(<BaptismsPageContent locale="en" />);

      expect(mockFetchEvents).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle error state', () => {
      mockUseEvents.mockReturnValue({
        events: [],
        loading: false,
        error: 'Failed to fetch baptisms',
        pagination: null,
        fetchEvents: mockFetchEvents,
        createEvent: mockCreateEvent,
        updateEvent: mockUpdateEvent,
        deleteEvent: mockDeleteEvent,
        confirmEvent: mockConfirmEvent,
        cancelEvent: mockCancelEvent,
      });

      render(<BaptismsPageContent locale="en" />);

      expect(mockFetchEvents).toHaveBeenCalled();
    });
  });
});

