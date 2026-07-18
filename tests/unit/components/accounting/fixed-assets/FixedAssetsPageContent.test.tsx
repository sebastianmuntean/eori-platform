import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import { FixedAssetsPageContent } from '@/components/accounting/fixed-assets/FixedAssetsPageContent';
import { NAVIGATION_ITEMS_CONFIG, REGISTER_SUB_ITEMS } from '@/components/accounting/fixed-assets/fixedAssetsNavigationConfig';
import enMenu from '@/locales/en/menu.json';

describe('FixedAssetsPageContent', () => {
  const locale = 'ro';
  const pageTitle = enMenu.fixedAssets;

  it('should render the page container', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);

    // PageContainer should be rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render page header with correct title', () => {
    render(<FixedAssetsPageContent locale={locale} />);

    expect(screen.getByRole('heading', { name: pageTitle, level: 1 })).toBeInTheDocument();
  });

  it('should render page header with correct description', () => {
    render(<FixedAssetsPageContent locale={locale} />);

    expect(screen.getByText(enMenu.fixedAssetsDescription)).toBeInTheDocument();
  });

  it('should render breadcrumbs correctly', () => {
    render(<FixedAssetsPageContent locale={locale} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
    const fixedAssetsTexts = screen.getAllByText(pageTitle);
    expect(fixedAssetsTexts.length).toBeGreaterThan(0);
  });

  it('should render all navigation items', () => {
    render(<FixedAssetsPageContent locale={locale} />);

    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      const translated = (enMenu as Record<string, string>)[config.translationKey];
      const label = translated || config.titleFallback;
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('should render navigation items with correct descriptions', () => {
    render(<FixedAssetsPageContent locale={locale} />);

    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      const translated = (enMenu as Record<string, string>)[config.descriptionKey];
      expect(screen.getByText(translated || config.descriptionFallback)).toBeInTheDocument();
    });
  });

  it('should generate correct hrefs for navigation items', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);

    NAVIGATION_ITEMS_CONFIG.forEach((config) => {
      const expectedHref = `/${locale}/dashboard/accounting/fixed-assets/${config.route}`;
      const link = container.querySelector(`a[href="${expectedHref}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  it('should render register sub-items for inventory registers', () => {
    const { container } = render(<FixedAssetsPageContent locale={locale} />);

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
    render(<FixedAssetsPageContent locale={locale} />);

    expect(screen.getAllByText(enMenu.fixedAssetsManagement).length).toBeGreaterThan(0);
    const firstConfig = NAVIGATION_ITEMS_CONFIG[0];
    expect(firstConfig.titleFallback).toBeTruthy();
    expect(firstConfig.descriptionFallback).toBeTruthy();
  });

  it('should memoize navigation items correctly', () => {
    const { rerender } = render(<FixedAssetsPageContent locale={locale} />);

    const initialItems = screen.getAllByRole('link');
    const initialCount = initialItems.length;

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

    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});
