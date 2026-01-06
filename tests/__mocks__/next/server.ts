import { vi } from 'vitest';

/**
 * Mock NextResponse
 */
export class NextResponse extends Response {
  static json<T>(
    body: T,
    init?: ResponseInit & { status?: number }
  ): NextResponse {
    const response = new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    return response;
  }

  static redirect(url: string | URL, status?: number): NextResponse {
    return new NextResponse(null, {
      status: status || 307,
      headers: {
        Location: typeof url === 'string' ? url : url.toString(),
      },
    });
  }

  static rewrite(url: string | URL): NextResponse {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'x-middleware-rewrite': typeof url === 'string' ? url : url.toString(),
      },
    });
  }

  static next(init?: ResponseInit): NextResponse {
    return new NextResponse(null, {
      ...init,
      headers: {
        'x-middleware-next': '1',
        ...init?.headers,
      },
    });
  }
}

/**
 * Mock NextRequest
 */
export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }

  get cookies() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(() => []),
    };
  }

  get geo() {
    return {
      city: undefined,
      country: undefined,
      region: undefined,
      latitude: undefined,
      longitude: undefined,
    };
  }

  get ip() {
    return undefined;
  }

  get ua() {
    return undefined;
  }
}

/**
 * Mock next/server module
 */
vi.mock('next/server', () => ({
  NextResponse,
  NextRequest,
}));

