import { NextResponse } from 'next/server';
import { getOpenAPISpecJSON } from '@/lib/openapi/schema-builder';

/**
 * GET /api/docs - Get OpenAPI specification in JSON format
 * 
 * Returns the complete OpenAPI 3.0 specification for the API.
 * This endpoint can be used by API clients and documentation tools.
 * 
 * @openapi
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification in JSON format
 *     tags: [Documentation]
 *     security:
 *       - optionalAuth: []
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const spec = getOpenAPISpecJSON();
    
    return new NextResponse(spec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate API documentation',
      },
      { status: 500 }
    );
  }
}







