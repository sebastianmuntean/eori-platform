/**
 * URL validation utilities for secure navigation
 */

/**
 * Validates a URL/link for safe navigation
 * Only allows relative paths (starting with /) or same-origin absolute URLs
 * Prevents XSS attacks via javascript:, data:, and other dangerous protocols
 * Prevents open redirect attacks
 * 
 * @param link - The URL/link to validate
 * @returns true if the link is safe to navigate to, false otherwise
 */
export function isValidNavigationLink(link: string): boolean {
  if (!link || typeof link !== 'string') {
    return false;
  }

  const trimmed = link.trim();
  if (!trimmed) {
    return false;
  }

  // Reject dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return false;
  }

  // Allow relative paths (starting with /)
  if (trimmed.startsWith('/')) {
    // Prevent path traversal attempts
    if (trimmed.includes('..')) {
      return false;
    }
    return true;
  }

  // For absolute URLs, only allow same-origin (http/https with same origin)
  try {
    const url = new URL(trimmed);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    // In browser environment, check if same origin
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      if (url.origin !== currentOrigin) {
        // Reject external URLs for security (or whitelist specific domains if needed)
        return false;
      }
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Validates a URL/link and returns a safe link for navigation
 * Returns null if the link is invalid or unsafe
 * 
 * @param link - The URL/link to validate
 * @returns The validated link if safe, null otherwise
 */
export function validateNavigationLink(link: string | null | undefined): string | null {
  if (!link) {
    return null;
  }

  if (isValidNavigationLink(link)) {
    return link;
  }

  return null;
}

/**
 * Validates external URLs (allows http/https from any origin)
 * Still blocks dangerous protocols like javascript:, data:, etc.
 * 
 * @param link - The URL/link to validate
 * @returns true if the link is a valid external URL, false otherwise
 */
export function isValidExternalLink(link: string): boolean {
  if (!link || typeof link !== 'string') {
    return false;
  }

  const trimmed = link.trim();
  if (!trimmed) {
    return false;
  }

  // Reject dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return false;
  }

  // Only allow absolute URLs with http or https protocol
  try {
    const url = new URL(trimmed);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Validates URL for form input (allows relative paths or valid absolute URLs)
 * More permissive than navigation validation - allows both internal and external URLs
 * 
 * @param link - The URL/link to validate
 * @returns true if the link is valid, false otherwise
 */
export function isValidUrlInput(link: string): boolean {
  if (!link || typeof link !== 'string') {
    return false;
  }

  const trimmed = link.trim();
  if (!trimmed) {
    return false;
  }

  // Reject dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return false;
  }

  // Allow relative paths (starting with /)
  if (trimmed.startsWith('/')) {
    // Prevent path traversal attempts
    if (trimmed.includes('..')) {
      return false;
    }
    return true;
  }

  // For absolute URLs, validate they are http or https
  try {
    const url = new URL(trimmed);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Safe navigation helper - handles internal vs external URLs
 * Uses router.push() for internal URLs and window.open() for external URLs
 * Returns void - does nothing if the URL is invalid
 * 
 * @param link - The URL/link to navigate to
 * @param router - Router object with push method (e.g., Next.js router)
 * @param options - Optional configuration
 * @param options.openExternalInNewTab - Whether to open external URLs in a new tab (default: true)
 */
export function safeNavigate(
  link: string,
  router: { push: (url: string) => void },
  options?: { openExternalInNewTab?: boolean }
): void {
  if (!link || typeof link !== 'string') {
    return;
  }

  const trimmed = link.trim();
  if (!trimmed) {
    return;
  }

  const openExternalInNewTab = options?.openExternalInNewTab !== false; // default to true

  // Check if it's an external URL (absolute URL with http/https)
  try {
    const url = new URL(trimmed);
    
    // If it's http or https, check if it's external
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      // Check if same origin (internal) or external
      if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;
        if (url.origin !== currentOrigin) {
          // External URL - validate and open in new tab
          if (isValidExternalLink(trimmed)) {
            if (openExternalInNewTab) {
              window.open(trimmed, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = trimmed;
            }
          }
          return;
        }
      }
      
      // Same-origin absolute URL - validate and use router
      if (isValidNavigationLink(trimmed)) {
        router.push(trimmed);
      }
      return;
    }
  } catch {
    // Not an absolute URL, check if it's a relative path
    if (trimmed.startsWith('/')) {
      // Relative path - validate and use router
      if (isValidNavigationLink(trimmed)) {
        router.push(trimmed);
      }
      return;
    }
    
    // Invalid URL format
    return;
  }
}

