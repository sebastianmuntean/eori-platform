/**
 * API client utilities for type-safe API calls
 */

import type { ApiResponse, ErrorResponse } from "@/types/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    console.log(`API Request: ${options.method || "GET"} ${endpoint}`);
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      console.error(`API Error: ${endpoint}`, error);
      return {
        success: false,
        error: error.error || "An error occurred",
        message: error.message,
      };
    }

    console.log(`✓ API Success: ${endpoint}`);
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error(`API Request failed: ${endpoint}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}




