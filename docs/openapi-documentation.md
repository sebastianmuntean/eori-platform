# OpenAPI/Swagger API Documentation

This document explains how to use and maintain the OpenAPI/Swagger API documentation system in the EORI Platform.

## Overview

The EORI Platform uses OpenAPI 3.0 specification with Swagger UI for interactive API documentation. The documentation is automatically generated from JSDoc comments in API route files.

## Accessing the Documentation

### Interactive Swagger UI
- **URL**: `http://localhost:4058/api/docs/ui`
- **Description**: Interactive Swagger UI where you can browse, test, and explore all API endpoints

### OpenAPI JSON Specification
- **URL**: `http://localhost:4058/api/docs`
- **Description**: Raw OpenAPI 3.0 JSON specification that can be used by API clients and tools

## Adding Documentation to API Routes

To document an API route, add OpenAPI annotations in JSDoc comments above the route handler function.

### Basic Example

```typescript
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a paginated list of users
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
export async function GET(request: Request) {
  // Route implementation
}
```

### Complete Example with Request Body

```typescript
/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user account
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  // Route implementation
}
```

## Common Patterns

### Authentication

Most endpoints require authentication via session cookie:

```yaml
security:
  - cookieAuth: []
```

For public endpoints:

```yaml
security: []
```

### Query Parameters

```yaml
parameters:
  - name: page
    in: query
    description: Page number
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: search
    in: query
    description: Search query
    schema:
      type: string
```

### Path Parameters

```yaml
parameters:
  - name: id
    in: path
    required: true
    description: User ID
    schema:
      type: string
      format: uuid
```

### Request Body

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required:
          - email
        properties:
          email:
            type: string
            format: email
          name:
            type: string
```

### Response Schemas

Use common schemas when available:

```yaml
responses:
  200:
    description: Success
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/PaginatedResponse'
  400:
    description: Bad request
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

### Available Common Schemas

- `#/components/schemas/Error` - Standard error response
- `#/components/schemas/SuccessResponse` - Standard success response
- `#/components/schemas/PaginatedResponse` - Paginated list response

## Tags

Organize endpoints using tags. Available tags include:

- Authentication
- Users
- Parishes
- Dioceses
- Deaneries
- Clients
- Events
- Email Templates
- Superadmin
- Accounting
- Parishioners
- Registratura
- Cemeteries
- Analytics
- Chat
- Online Forms
- Audit Logs
- Documentation

## Security Schemes

The API supports two authentication methods:

1. **Cookie Authentication** (`cookieAuth`): Session-based authentication using cookies
2. **Bearer Authentication** (`bearerAuth`): Token-based authentication (if implemented)

## Best Practices

1. **Always document endpoints**: Every API route should have OpenAPI annotations
2. **Use descriptive summaries**: Clear, concise summaries help developers understand the endpoint
3. **Include examples**: Add examples to request bodies and responses for better clarity
4. **Document all parameters**: Include all query, path, and header parameters
5. **Specify response codes**: Document all possible HTTP status codes and their meanings
6. **Use tags**: Group related endpoints using appropriate tags
7. **Reference common schemas**: Reuse common schemas for consistency

## Testing the Documentation

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:4058/api/docs/ui`
3. Browse the API endpoints
4. Use the "Try it out" feature to test endpoints directly from the UI

## Troubleshooting

### Documentation not appearing

- Ensure JSDoc comments start with `@openapi`
- Check that the route file is in `src/app/api/`
- Verify the OpenAPI syntax is correct (YAML format in JSDoc)

### Path resolution issues

- The schema builder uses absolute paths, so it should work regardless of where the server is run from

### Missing endpoints

- Check that the route file exports the HTTP method function (GET, POST, etc.)
- Verify the JSDoc comment is directly above the exported function

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)



