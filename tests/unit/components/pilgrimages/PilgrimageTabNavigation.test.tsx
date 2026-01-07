import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../setup/test-utils';
import { PilgrimageTabNavigation } from '@/components/pilgrimages/PilgrimageTabNavigation';

const mockTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'documents', label: 'Documents' },
  { id: 'payments', label: 'Payments' },
];

describe('PilgrimageTabNavigation', () => {
  it('should render all tabs', () => {
    const onTabChange = vi.fn();
    render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={onTabChange}
      />
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="participants"
        onTabChange={onTabChange}
      />
    );

    const activeTab = screen.getByText('Participants');
    expect(activeTab).toHaveClass('border-primary', 'text-primary');
  });

  it('should call onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={onTabChange}
      />
    );

    const participantsTab = screen.getByText('Participants');
    fireEvent.click(participantsTab);

    expect(onTabChange).toHaveBeenCalledWith('participants');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it('should apply correct classes to active tab', () => {
    const onTabChange = vi.fn();
    render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="schedule"
        onTabChange={onTabChange}
      />
    );

    const activeTab = screen.getByText('Schedule');
    const inactiveTab = screen.getByText('Overview');

    expect(activeTab).toHaveClass('border-primary', 'text-primary');
    expect(inactiveTab).toHaveClass('border-transparent', 'text-text-secondary');
  });

  it('should handle empty tabs array', () => {
    const onTabChange = vi.fn();
    render(
      <PilgrimageTabNavigation
        tabs={[]}
        activeTab=""
        onTabChange={onTabChange}
      />
    );

    // Should render without errors
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should handle tab change to same tab', () => {
    const onTabChange = vi.fn();
    render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={onTabChange}
      />
    );

    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    expect(onTabChange).toHaveBeenCalledWith('overview');
  });

  it('should render with correct structure', () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <PilgrimageTabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={onTabChange}
      />
    );

    // Check for border-b class on container
    const navigationContainer = container.querySelector('.border-b');
    expect(navigationContainer).toBeInTheDocument();
  });
});

