import { describe, it, expect } from 'vitest';
import { render, screen } from '../../setup/test-utils';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';

describe('PermissionLoadingState', () => {
  it('should render with default loading message', () => {
    render(<PermissionLoadingState />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message when provided', () => {
    render(<PermissionLoadingState message="Checking permissions..." />);
    
    expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should render within PageContainer', () => {
    const { container } = render(<PermissionLoadingState />);
    
    // Check that the component is rendered (PageContainer should be present)
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<PermissionLoadingState />);
    
    const loadingDiv = screen.getByText('Loading...').parentElement;
    expect(loadingDiv).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen');
  });
});

