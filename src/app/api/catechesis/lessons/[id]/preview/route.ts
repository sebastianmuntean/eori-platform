import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisLessons } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * GET /api/catechesis/lessons/[id]/preview - Get lesson content for preview (iframe)
 * Returns only the content HTML, suitable for embedding in iframe
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { id } = await params;

    const [lesson] = await db
      .select({
        id: catechesisLessons.id,
        title: catechesisLessons.title,
        content: catechesisLessons.content,
        parishId: catechesisLessons.parishId,
      })
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .limit(1);

    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check parish access
    await requireParishAccess(lesson.parishId, false);

    // Return content as HTML
    return new NextResponse(lesson.content || '<p>No content available</p>', {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }, { endpoint: '/api/catechesis/lessons/[id]/preview', method: 'GET' });
}



