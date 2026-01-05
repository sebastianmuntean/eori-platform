/**
 * API client utilities for type-safe API calls
 * 
 * Provides a consistent interface for making HTTP requests with proper error handling,
 * type safety, and standardized response formatting.
 */

import type { ApiResponse, ErrorResponse } from "@/types/api";

/**
 * Default headers for API requests
 */
const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

/**
 * Checks if a response has JSON content type
 */
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType?.includes("application/json") ?? false;
}

/**
 * Safely parses JSON response, handling empty or non-JSON responses
 */
async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  if (!isJsonResponse(response)) {
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  try {
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (error) {
    console.warn("Failed to parse JSON response:", error);
    return null;
  }
}

/**
 * Extracts error message from error response data
 */
function extractErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null) {
    const errorData = data as Partial<ErrorResponse>;
    return errorData.error ?? errorData.message ?? "An error occurred";
  }
  return "An error occurred";
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  error: string,
  message?: string
): ApiResponse<never> {
  return {
    success: false,
    error,
    message,
  };
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Core API request function with comprehensive error handling
 * 
 * @param endpoint - The API endpoint URL
 * @param options - Fetch API options (method, headers, body, etc.)
 * @returns Promise resolving to a standardized ApiResponse
 * 
 * @example
 * ```typescript
 * const response = await apiRequest<User>('/api/users/1', { method: 'GET' });
 * if (response.success) {
 *   console.log(response.data); // Type-safe access
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const method = options.method || "GET";
  const requestId = `${method} ${endpoint}`;

  try {
    // Merge headers, ensuring Content-Type is set for requests with body
    const headers: HeadersInit = {
      ...DEFAULT_HEADERS,
      ...options.headers,
    };

    // Remove Content-Type for requests without body (GET, DELETE)
    if (!options.body && (method === "GET" || method === "DELETE")) {
      delete (headers as Record<string, string>)["Content-Type"];
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await parseJsonResponse<ErrorResponse>(response);
      const errorMessage = errorData
        ? extractErrorMessage(errorData)
        : `HTTP ${response.status}: ${response.statusText}`;

      console.error(`API Error [${requestId}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      return createErrorResponse(
        errorMessage,
        errorData?.message || response.statusText
      );
    }

    // Parse successful response
    const data = await parseJsonResponse<T>(response);

    if (data === null && response.status !== 204) {
      console.warn(`Empty response body for [${requestId}]`);
      return createErrorResponse("Empty response from server");
    }

    return createSuccessResponse(data as T);
  } catch (error) {
    // Handle network errors, timeouts, and other fetch failures
    const errorMessage =
      error instanceof Error
        ? error.message
        : error instanceof TypeError
          ? "Network error: Unable to reach server"
          : "An unexpected error occurred";

    console.error(`API Request failed [${requestId}]:`, error);

    return createErrorResponse(errorMessage);
  }
}

/**
 * Performs a GET request to the specified endpoint
 * 
 * @param endpoint - The API endpoint URL
 * @returns Promise resolving to ApiResponse with the requested data
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * Performs a POST request with a JSON body
 * 
 * @param endpoint - The API endpoint URL
 * @param body - The request body to be serialized as JSON
 * @returns Promise resolving to ApiResponse with the response data
 */
export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Performs a PUT request with a JSON body
 * 
 * @param endpoint - The API endpoint URL
 * @param body - The request body to be serialized as JSON
 * @returns Promise resolving to ApiResponse with the response data
 */
export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Performs a PATCH request with a JSON body
 * 
 * @param endpoint - The API endpoint URL
 * @param body - The request body to be serialized as JSON
 * @returns Promise resolving to ApiResponse with the response data
 */
export async function apiPatch<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Performs a DELETE request to the specified endpoint
 * 
 * @param endpoint - The API endpoint URL
 * @returns Promise resolving to ApiResponse
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}




