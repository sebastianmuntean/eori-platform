/**
 * Utility functions for global settings
 */

let cachedVatRate: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the default VAT rate from global settings
 * Uses caching to avoid excessive API calls
 */
export async function getDefaultVatRate(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if available and not expired
  if (cachedVatRate && (now - cacheTimestamp) < CACHE_DURATION) {
    const rate = parseFloat(cachedVatRate);
    return isNaN(rate) ? 19 : rate;
  }

  try {
    const response = await fetch('/api/superadmin/global-settings?key=default_vat_rate');
    const data = await response.json();

    if (data.success && data.data) {
      const value = data.data.value || '19';
      cachedVatRate = value;
      cacheTimestamp = now;
      const rate = parseFloat(value);
      return isNaN(rate) ? 19 : rate;
    }
  } catch (error) {
    console.error('Error fetching default VAT rate:', error);
  }

  // Return default value if fetch fails
  return 19;
}

/**
 * Get the default VAT rate synchronously (uses cached value or default)
 * For use in client components where async is not possible
 */
export function getDefaultVatRateSync(): number {
  if (cachedVatRate) {
    const rate = parseFloat(cachedVatRate);
    return isNaN(rate) ? 19 : rate;
  }
  return 19;
}

/**
 * Clear the VAT rate cache (useful after updating settings)
 */
export function clearVatRateCache() {
  cachedVatRate = null;
  cacheTimestamp = 0;
}

