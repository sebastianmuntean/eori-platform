import { NextResponse } from 'next/server';
import { generateSwaggerUIHTML } from '@/lib/swagger/swagger-ui-template';
import { DEFAULT_SWAGGER_UI_CONFIG } from '@/lib/swagger/swagger-ui-config';

/**
 * GET /api/docs/ui - Serve Swagger UI for interactive API documentation
 * 
 * Returns an HTML page with Swagger UI for browsing and testing the API.
 * The Swagger UI is served as a static HTML page with embedded JavaScript
 * that loads the OpenAPI specification from /api/docs endpoint.
 * 
 * @openapi
 * /api/docs/ui:
 *   get:
 *     summary: Get Swagger UI
 *     description: Returns an interactive Swagger UI for API documentation
 *     tags: [Documentation]
 *     security:
 *       - optionalAuth: []
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export async function GET() {
  try {
    const html = generateSwaggerUIHTML({
      ...DEFAULT_SWAGGER_UI_CONFIG,
      url: '/api/docs',
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error serving Swagger UI:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to serve API documentation UI',
      },
      { status: 500 }
    );
  }
}

