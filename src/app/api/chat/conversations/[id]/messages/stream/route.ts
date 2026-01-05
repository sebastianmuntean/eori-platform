import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  registerConnection,
  unregisterConnection,
} from '@/lib/services/chat-sse-service';
import { getConversationById } from '@/lib/services/chat-service';
import { formatErrorResponse, logError } from '@/lib/errors';

/**
 * GET /api/chat/conversations/[id]/messages/stream - SSE stream for real-time message updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  console.log(`Step 1: GET /api/chat/conversations/${conversationId}/messages/stream - Opening SSE connection`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return new Response('Not authenticated', { status: 401 });
    }

    // Verify user is participant
    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const send = (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('Error sending SSE data:', error);
          }
        };

        // Send connection confirmation
        send(`data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`);

        // Register connection
        const client = {
          conversationId,
          userId,
          send,
        };
        registerConnection(client);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`SSE connection closed for conversation ${conversationId}`);
          unregisterConnection(client);
          try {
            controller.close();
          } catch (error) {
            // Controller might already be closed
          }
        });

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            send(`: ping\n\n`);
          } catch (error) {
            clearInterval(pingInterval);
            unregisterConnection(client);
            controller.close();
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error) {
    console.error('❌ Error opening SSE stream:', error);
    logError(error, {
      endpoint: '/api/chat/conversations/[id]/messages/stream',
      method: 'GET',
    });
    return new Response('Internal server error', { status: 500 });
  }
}

