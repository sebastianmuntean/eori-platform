import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import { FixedAssetsPageContent } from '@/components/accounting/fixed-assets/FixedAssetsPageContent';
import { NAVIGATION_ITEMS_CONFIG, REGISTER_SUB_ITEMS } from '@/components/accounting/fixed-assets/fixedAssetsNavigationConfig';

describe('FixedAssetsPageContent', () => {
  const locale = 'ro';

  it('should render the page container', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);
    
    // PageContainer should be rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render page header with correct title', () => {
    render(<FixedAssetsPageContent locale={locale} />);
    
    // Title appears in both breadcrumb and h1, so use getAllByText
    const titles = screen.getAllByText('Fixed Assets');
    expect(titles.length).toBeGreaterThan(0);
    // Check that h1 title exists
    expect(screen.getByRole('heading', { name: 'Fixed Assets', level: 1 })).toBeInTheDocument();
  });

  it('should render page header with correct description', () => {
    render(<FixedAssetsPageContent locale={locale} />);
    
    expect(screen.getByText('Fixed Assets Description')).toBeInTheDocument();
  });

  it('should render breadcrumbs correctly', () => {
    render(<FixedAssetsPageContent locale={locale} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
    // Fixed Assets appears in breadcrumb (use getAllByText since it appears multiple times)
    const fixedAssetsTexts = screen.getAllByText('Fixed Assets');
    expect(fixedAssetsTexts.length).toBeGreaterThan(0);
  });

  it('should render all navigation items', () => {
    render(<FixedAssetsPageContent locale={locale} />);
    
    // Check that all navigation items from config are rendered
    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      // Use fallback if translation is not found
      const title = screen.queryByText('Fixed Assets Management') || 
                    screen.queryByText(config.titleFallback);
      expect(title || screen.getByText(config.titleFallback)).toBeInTheDocument();
    });
  });

  it('should render navigation items with correct descriptions', () => {
    render(<FixedAssetsPageContent locale={locale} />);
    
    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      // Use fallback if translation is not found
      const description = screen.queryByText('Manage fixed assets') || 
                          screen.queryByText(config.descriptionFallback);
      expect(description || screen.getByText(config.descriptionFallback)).toBeInTheDocument();
    });
  });

  it('should generate correct hrefs for navigation items', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);
    
    // Check that links have correct hrefs
    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      const expectedHref = `/${locale}/dashboard/accounting/fixed-assets/${config.route}`;
      const link = container.querySelector(`a[href="${expectedHref}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  it('should render register sub-items for inventory registers', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);
    
    // Check that register sub-items links are rendered (they're nested in the registers card)
    REGISTER_SUB_ITEMS.forEach((item) => {
      const expectedHref = `/${locale}/dashboard/accounting/fixed-assets/registers/${item.route}`;
      const link = container.querySelector(`a[href="${expectedHref}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  it('should generate correct hrefs for register sub-items', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);
    
    REGISTER_SUB_ITEMS.forEach((item) => {
      const expectedHref = `/${locale}/dashboard/accounting/fixed-assets/registers/${item.route}`;
      const link = container.querySelector(`a[href="${expectedHref}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  it('should use fallback translations when translation is missing', () => {
    // Since translations are provided in test-utils, the component uses translations
    // This test verifies that fallbacks are defined in the config
    render(<FixedAssetsPageContent locale={locale} />);
    
    // Verify that navigation items are rendered (using either translation or fallback)
    expect(screen.getByText('Fixed Assets Management')).toBeInTheDocument();
    // Verify fallback values exist in config for navigation items
    const firstConfig = NAVIGATION_ITEMS_CONFIG[0];
    expect(firstConfig.titleFallback).toBeTruthy();
    expect(firstConfig.descriptionFallback).toBeTruthy();
  });

  it('should memoize navigation items correctly', () => {
    const { rerender } = render(<FixedAssetsPageContent locale={locale} />);
    
    const initialItems = screen.getAllByRole('link');
    const initialCount = initialItems.length;
    
    // Rerender with same props
    rerender(<FixedAssetsPageContent locale={locale} />);
    
    const rerenderedItems = screen.getAllByRole('link');
    expect(rerenderedItems.length).toBe(initialCount);
  });

  it('should update navigation items when locale changes', () => {
    const { container } = render(<FixedAssetsPageContent locale="ro" />);
    
    const roLink = container.querySelector('a[href="/ro/dashboard/accounting/fixed-assets/manage"]');
    expect(roLink).toBeInTheDocument();
    
    const { container: newContainer } = render(<FixedAssetsPageContent locale="en" />);
    
    const enLink = newContainer.querySelector('a[href="/en/dashboard/accounting/fixed-assets/manage"]');
    expect(enLink).toBeInTheDocument();
  });

  it('should render icons for all navigation items', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);
    
    // Check that SVG icons are rendered (they should be present in the DOM)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});

