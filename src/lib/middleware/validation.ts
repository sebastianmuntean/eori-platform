/**
 * Input Validation Middleware
 * 
 * Provides utilities for validating and sanitizing API inputs
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T> } | NextResponse {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return createErrorResponse(
      `Invalid query parameters: ${result.error.errors[0].message}`,
      400
    );
  }
  
  return { data: result.data };
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | NextResponse> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return createErrorResponse(
        `Invalid request body: ${result.error.errors[0].message}`,
        400
      );
    }
    
    return { data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    throw error;
  }
}

/**
 * Validate URL parameters (route params) against a Zod schema
 */
export function validateUrlParams<T extends z.ZodType>(
  params: Record<string, string | string[] | undefined>,
  schema: T
): { data: z.infer<T> } | NextResponse {
  // Convert params to plain object, handling array values
  const plainParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      plainParams[key] = value[0]; // Take first value if array
    } else if (value !== undefined) {
      plainParams[key] = value;
    }
  }
  
  const result = schema.safeParse(plainParams);
  
  if (!result.success) {
    return createErrorResponse(
      `Invalid URL parameters: ${result.error.errors[0].message}`,
      400
    );
  }
  
  return { data: result.data };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearch(search: string | null, maxLength: number = 255): string {
  if (!search) return '';
  return sanitizeString(search, maxLength);
}

