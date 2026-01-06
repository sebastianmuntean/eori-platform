/**
 * Route metadata definitions and helpers for OpenAPI documentation
 * 
 * This file provides TypeScript types and utilities for documenting API routes
 * with OpenAPI/Swagger annotations in JSDoc comments.
 */

/**
 * Common response schemas that can be referenced in route documentation
 */
export const commonSchemas = {
  Error: {
    description: 'Error response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
      },
    },
  },
  SuccessResponse: {
    description: 'Success response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SuccessResponse',
        },
      },
    },
  },
  PaginatedResponse: {
    description: 'Paginated response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/PaginatedResponse',
        },
      },
    },
  },
};

/**
 * Common parameter definitions
 */
export const commonParameters = {
  page: {
    name: 'page',
    in: 'query',
    description: 'Page number (1-indexed)',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1,
    },
  },
  pageSize: {
    name: 'pageSize',
    in: 'query',
    description: 'Number of items per page',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
    },
  },
  search: {
    name: 'search',
    in: 'query',
    description: 'Search query string',
    required: false,
    schema: {
      type: 'string',
    },
  },
  sortBy: {
    name: 'sortBy',
    in: 'query',
    description: 'Field to sort by',
    required: false,
    schema: {
      type: 'string',
    },
  },
  sortOrder: {
    name: 'sortOrder',
    in: 'query',
    description: 'Sort order (asc or desc)',
    required: false,
    schema: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
    },
  },
  id: {
    name: 'id',
    in: 'path',
    description: 'Resource ID (UUID)',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid',
    },
  },
};

/**
 * Security requirement definitions
 */
export const securityRequirements = {
  cookieAuth: {
    cookieAuth: [] as string[],
  },
  bearerAuth: {
    bearerAuth: [] as string[],
  },
  optionalAuth: {
    // No security requirement - public endpoint
  },
};

/**
 * Helper to generate JSDoc OpenAPI annotation for a route
 * 
 * @example
 * ```typescript
 * /**
 *  * @openapi
 *  * /api/users:
 *  *   get:
 *  *     summary: Get all users
 *  *     tags: [Users]
 *  *     security:
 *  *       - cookieAuth: []
 *  *     parameters:
 *  *       - $ref: '#/components/parameters/page'
 *  *     responses:
 *  *       200:
 *  *         description: List of users
 *  *         content:
 *  *           application/json:
 *  *             schema:
 *  *               $ref: '#/components/schemas/PaginatedResponse'
 *  * /
 * ```
 */
export function generateRouteDoc(options: {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  security?: 'cookieAuth' | 'bearerAuth' | 'optionalAuth';
  parameters?: Array<typeof commonParameters[keyof typeof commonParameters]>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content: {
      'application/json': {
        schema: Record<string, any>;
      };
    };
  };
  responses: Record<string, {
    description: string;
    content?: {
      'application/json': {
        schema: Record<string, any>;
        example?: any;
      };
    };
  }>;
}): string {
  // This is a helper function for generating documentation strings
  // The actual documentation should be written in JSDoc comments in route files
  return '';
}

/**
 * Common response status codes
 */
export const statusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};







