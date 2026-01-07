import { describe, it, expect } from 'vitest';
import { render } from '../../../../setup/test-utils';
import {
  FixedAssetsIconBox,
  FixedAssetsIconDocument,
  FixedAssetsIconExit,
  FixedAssetsIconHash,
  FixedAssetsIconList,
  FixedAssetsIconTable,
} from '@/components/accounting/fixed-assets/FixedAssetsIcons';

describe('FixedAssetsIcons', () => {
  describe('FixedAssetsIconBox', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconBox />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconBox className="w-10 h-10" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-10', 'h-10');
    });

    it('should have correct SVG attributes', () => {
      const { container } = render(<FixedAssetsIconBox />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render path element', () => {
      const { container } = render(<FixedAssetsIconBox />);
      const path = container.querySelector('path');
      
      expect(path).toBeInTheDocument();
      // SVG attributes are rendered as kebab-case in HTML
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('FixedAssetsIconDocument', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconDocument />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconDocument className="w-12 h-12" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('w-12', 'h-12');
    });
  });

  describe('FixedAssetsIconExit', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconExit />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconExit className="w-6 h-6" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('w-6', 'h-6');
    });
  });

  describe('FixedAssetsIconHash', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconHash />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconHash className="w-16 h-16" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('w-16', 'h-16');
    });
  });

  describe('FixedAssetsIconList', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconList />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconList className="w-20 h-20" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('w-20', 'h-20');
    });
  });

  describe('FixedAssetsIconTable', () => {
    it('should render with default className', () => {
      const { container } = render(<FixedAssetsIconTable />);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom className', () => {
      const { container } = render(<FixedAssetsIconTable className="w-4 h-4" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('w-4', 'h-4');
    });
  });

  describe('All icons', () => {
    it('should all have consistent SVG structure', () => {
      const icons = [
        <FixedAssetsIconBox key="box" />,
        <FixedAssetsIconDocument key="doc" />,
        <FixedAssetsIconExit key="exit" />,
        <FixedAssetsIconHash key="hash" />,
        <FixedAssetsIconList key="list" />,
        <FixedAssetsIconTable key="table" />,
      ];

      icons.forEach((icon) => {
        const { container } = render(icon);
        const svg = container.querySelector('svg');
        const path = container.querySelector('path');
        
        expect(svg).toBeInTheDocument();
        expect(path).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
      });
    });
  });
});

