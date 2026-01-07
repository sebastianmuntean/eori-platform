import { describe, it, expect } from 'vitest';
import { formatDate } from '@/utils/date';

describe('formatDate', () => {
  it('should format a valid date string', () => {
    const date = '2024-01-15';
    const locale = 'en-US';
    const result = formatDate(date, locale);
    
    expect(result).toBeTruthy();
    expect(result).not.toBe('-');
    expect(result).toMatch(/2024/);
  });

  it('should return "-" for null input', () => {
    const result = formatDate(null, 'en-US');
    expect(result).toBe('-');
  });

  it('should format dates for different locales', () => {
    const date = '2024-01-15';
    
    const enResult = formatDate(date, 'en-US');
    const roResult = formatDate(date, 'ro-RO');
    
    expect(enResult).toBeTruthy();
    expect(roResult).toBeTruthy();
    // Both should contain the year
    expect(enResult).toMatch(/2024/);
    expect(roResult).toMatch(/2024/);
  });

  it('should handle ISO date strings', () => {
    const date = '2024-01-15T10:30:00Z';
    const result = formatDate(date, 'en-US');
    
    expect(result).toBeTruthy();
    expect(result).toMatch(/2024/);
  });

  it('should handle date-only strings', () => {
    const date = '2024-12-31';
    const result = formatDate(date, 'en-US');
    
    expect(result).toBeTruthy();
    expect(result).toMatch(/2024/);
  });

  it('should be consistent with multiple calls', () => {
    const date = '2024-01-15';
    const locale = 'en-US';
    
    const result1 = formatDate(date, locale);
    const result2 = formatDate(date, locale);
    
    expect(result1).toBe(result2);
  });
});
