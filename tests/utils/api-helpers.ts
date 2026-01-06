import { NextResponse } from 'next/server';

/**
 * Create a mock Next.js Request object
 */
export function createMockRequest(
  url: string,
  init?: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    signal?: AbortSignal | null;
  }
): Request {
  const request = new Request(url, {
    method: 'GET',
    ...init,
  });

  return request;
}

/**
 * Create a mock Request with search params
 */
export function createMockRequestWithParams(
  baseUrl: string,
  params: Record<string, string | null>
): Request {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return createMockRequest(url.toString());
}

/**
 * Extract JSON data from NextResponse
 * @throws Error if response is not valid JSON
 */
export async function extractJsonResponse<T = unknown>(
  response: NextResponse
): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON response but got content-type: ${contentType || 'unknown'}`
    );
  }

  try {
    const text = await response.text();
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract blob/buffer from NextResponse
 */
export async function extractBlobResponse(
  response: NextResponse
): Promise<ArrayBuffer> {
  return await response.arrayBuffer();
}

/**
 * Assert response is JSON with expected status
 * @throws Error if status or content-type doesn't match
 */
export async function assertJsonResponse<T = unknown>(
  response: NextResponse,
  expectedStatus: number
): Promise<T> {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}`
    );
  }
  
  return extractJsonResponse<T>(response);
}

/**
 * Assert response is a file download with expected headers
 * @throws Error if status, content-type, or filename doesn't match
 */
export function assertFileResponse(
  response: NextResponse,
  expectedContentType: string,
  expectedFilename?: string
): void {
  if (response.status !== 200) {
    throw new Error(`Expected status 200 but got ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType !== expectedContentType) {
    throw new Error(
      `Expected content-type ${expectedContentType} but got ${contentType}`
    );
  }

  if (expectedFilename) {
    const contentDisposition = response.headers.get('content-disposition');
    if (!contentDisposition || !contentDisposition.includes(`filename="${expectedFilename}"`)) {
      throw new Error(
        `Expected filename "${expectedFilename}" in content-disposition but got: ${contentDisposition || 'none'}`
      );
    }
  }
}

/**
 * Assert error response structure
 * @throws Error if response doesn't match expected error format
 */
export async function assertErrorResponse(
  response: NextResponse,
  expectedStatus: number = 500
): Promise<{ success: false; error: string; statusCode?: number }> {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected error status ${expectedStatus} but got ${response.status}`
    );
  }
  
  const data = await extractJsonResponse(response);
  
  if (typeof data !== 'object' || data === null) {
    throw new Error('Expected error response to be an object');
  }
  
  const errorData = data as Record<string, unknown>;
  
  if (errorData.success !== false) {
    throw new Error('Expected error response to have success: false');
  }
  
  if (typeof errorData.error !== 'string') {
    throw new Error('Expected error response to have error: string');
  }
  
  return data as { success: false; error: string; statusCode?: number };
}

/**
 * Create mock route params for Next.js dynamic routes
 * Next.js 13+ uses async params, so this returns a Promise
 */
export function createMockParams<T extends Record<string, string>>(
  params: T
): Promise<T> {
  return Promise.resolve(params);
}
