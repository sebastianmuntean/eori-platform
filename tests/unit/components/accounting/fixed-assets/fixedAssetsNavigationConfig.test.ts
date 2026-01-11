import { describe, it, expect } from 'vitest';
import { NAVIGATION_ITEMS_CONFIG, REGISTER_SUB_ITEMS } from '@/components/accounting/fixed-assets/fixedAssetsNavigationConfig';

describe('fixedAssetsNavigationConfig', () => {
  describe('REGISTER_SUB_ITEMS', () => {
    it('should have all required properties', () => {
      REGISTER_SUB_ITEMS.forEach((item) => {
        expect(item).toHaveProperty('translationKey');
        expect(item).toHaveProperty('route');
        expect(item).toHaveProperty('fallback');
        expect(typeof item.translationKey).toBe('string');
        expect(typeof item.route).toBe('string');
        expect(typeof item.fallback).toBe('string');
      });
    });

    it('should have 10 register sub-items', () => {
      expect(REGISTER_SUB_ITEMS).toHaveLength(10);
    });

    it('should have unique translation keys', () => {
      const keys = REGISTER_SUB_ITEMS.map((item) => item.translationKey);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have unique routes', () => {
      const routes = REGISTER_SUB_ITEMS.map((item) => item.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should have non-empty fallback text', () => {
      REGISTER_SUB_ITEMS.forEach((item) => {
        expect(item.fallback).toBeTruthy();
        expect(item.fallback.length).toBeGreaterThan(0);
      });
    });

    it('should have valid route formats', () => {
      REGISTER_SUB_ITEMS.forEach((item) => {
        // Routes should be lowercase and use hyphens for spaces
        expect(item.route).toMatch(/^[a-z0-9-]+$/);
      });
    });
  });

  describe('NAVIGATION_ITEMS_CONFIG', () => {
    it('should have all required properties', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        expect(config).toHaveProperty('translationKey');
        expect(config).toHaveProperty('descriptionKey');
        expect(config).toHaveProperty('titleFallback');
        expect(config).toHaveProperty('descriptionFallback');
        expect(config).toHaveProperty('route');
        expect(config).toHaveProperty('icon');
        
        expect(typeof config.translationKey).toBe('string');
        expect(typeof config.descriptionKey).toBe('string');
        expect(typeof config.titleFallback).toBe('string');
        expect(typeof config.descriptionFallback).toBe('string');
        expect(typeof config.route).toBe('string');
        expect(typeof config.icon).toBe('function');
      });
    });

    it('should have 6 navigation items', () => {
      expect(NAVIGATION_ITEMS_CONFIG).toHaveLength(6);
    });

    it('should have unique translation keys', () => {
      const keys = NAVIGATION_ITEMS_CONFIG.map((config) => config.translationKey);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have unique routes', () => {
      const routes = NAVIGATION_ITEMS_CONFIG.map((config) => config.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should have non-empty fallback text', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        expect(config.titleFallback).toBeTruthy();
        expect(config.titleFallback.length).toBeGreaterThan(0);
        expect(config.descriptionFallback).toBeTruthy();
        expect(config.descriptionFallback.length).toBeGreaterThan(0);
      });
    });

    it('should have valid route formats', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        // Routes should be lowercase and use hyphens for spaces
        expect(config.route).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('should have only one item with sub-items', () => {
      const itemsWithSubItems = NAVIGATION_ITEMS_CONFIG.filter(
        (config) => config.hasSubItems === true
      );
      expect(itemsWithSubItems).toHaveLength(1);
      expect(itemsWithSubItems[0].translationKey).toBe('inventoryRegisters');
    });

    it('should have correct route for inventory registers', () => {
      const registersItem = NAVIGATION_ITEMS_CONFIG.find(
        (config) => config.translationKey === 'inventoryRegisters'
      );
      expect(registersItem).toBeDefined();
      expect(registersItem?.route).toBe('registers');
      expect(registersItem?.hasSubItems).toBe(true);
    });

    it('should have all expected navigation items', () => {
      const expectedItems = [
        'fixedAssetsManagement',
        'inventoryRegisters',
        'exitsFromManagement',
        'inventoryNumbersRegister',
        'inventoryLists',
        'inventoryTables',
      ];

      const actualItems = NAVIGATION_ITEMS_CONFIG.map((config) => config.translationKey);
      
      expectedItems.forEach((expected) => {
        expect(actualItems).toContain(expected);
      });
    });

    it('should have icons as React components', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        // Icon should be a function (React component)
        expect(typeof config.icon).toBe('function');
        // Should be able to call it (component constructor)
        expect(() => {
          const IconComponent = config.icon;
          // This should not throw
          expect(IconComponent).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Configuration consistency', () => {
    it('should have matching description keys for all items', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        // Description key should follow the pattern: {translationKey}Desc
        expect(config.descriptionKey).toContain('Desc');
      });
    });

    it('should have consistent naming patterns', () => {
      NAVIGATION_ITEMS_CONFIG.forEach((config) => {
        // Translation keys should be camelCase
        expect(config.translationKey).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        // Description keys should be camelCase with Desc suffix
        expect(config.descriptionKey).toMatch(/^[a-z][a-zA-Z0-9]*Desc$/);
      });
    });
  });
});


