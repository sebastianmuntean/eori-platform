import swaggerJsdoc from 'swagger-jsdoc';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';

/**
 * OpenAPI 3.0 specification builder
 * Scans route files for JSDoc comments and generates OpenAPI schema
 */

// Resolve API route paths relative to project root
const projectRoot = process.cwd();
const apiRoutesPath = path.join(projectRoot, 'src', 'app', 'api');

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EORI Platform API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the EORI Platform',
      contact: {
        name: 'EORI Platform Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4058',
        description: 'Development server',
      },
      {
        url: process.env.NEXT_PUBLIC_API_URL_PROD || 'https://api.eori-platform.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
          description: 'Session cookie authentication',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication (if implemented)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
          },
          required: ['success', 'error'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
          required: ['success'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                pageSize: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
          required: ['success', 'data', 'pagination'],
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Parishes',
        description: 'Parish management operations',
      },
      {
        name: 'Dioceses',
        description: 'Diocese management operations',
      },
      {
        name: 'Deaneries',
        description: 'Deanery management operations',
      },
      {
        name: 'Clients',
        description: 'Client management operations',
      },
      {
        name: 'Events',
        description: 'Event management (weddings, baptisms, funerals)',
      },
      {
        name: 'Email Templates',
        description: 'Email template management',
      },
      {
        name: 'Superadmin',
        description: 'Superadmin operations (roles, permissions)',
      },
      {
        name: 'Accounting',
        description: 'Accounting and financial operations',
      },
      {
        name: 'Parishioners',
        description: 'Parishioner management',
      },
      {
        name: 'Registratura',
        description: 'Document registry operations',
      },
      {
        name: 'Cemeteries',
        description: 'Cemetery management',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
      {
        name: 'Chat',
        description: 'Chat and messaging',
      },
      {
        name: 'Online Forms',
        description: 'Online form management',
      },
      {
        name: 'Audit Logs',
        description: 'Audit log queries',
      },
      {
        name: 'Documentation',
        description: 'API documentation endpoints',
      },
    ],
  },
  apis: [
    path.join(apiRoutesPath, '**', '*.ts'), // Scan all API route files
    path.join(apiRoutesPath, '**', 'route.ts'), // Alternative pattern for route files
  ],
};

/**
 * Generate OpenAPI specification from route files
 */
export function generateOpenAPISpec(): OpenAPIV3.Document {
  try {
    const spec = swaggerJsdoc(swaggerOptions) as OpenAPIV3.Document;
    
    // Add default security requirements
    if (!spec.security) {
      spec.security = [
        { cookieAuth: [] },
      ];
    }

    return spec;
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    throw error;
  }
}

/**
 * Get OpenAPI specification as JSON string
 */
export function getOpenAPISpecJSON(): string {
  const spec = generateOpenAPISpec();
  return JSON.stringify(spec, null, 2);
}

