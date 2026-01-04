import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * GET /api/registratura/general-register/[id] - Get document by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log(`Step 1: GET /api/registratura/general-register/[id] - Fetching document`);
    const { id } = await params;
    
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document ${id} found`);
    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/general-register/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

