/**
 * Server-Sent Events service for real-time chat updates
 * 
 * This service manages active SSE connections for chat conversations.
 * In a production environment with multiple server instances, you would
 * use a message broker (Redis Pub/Sub, RabbitMQ, etc.) to broadcast
 * messages across instances.
 */

import { conversations, messages, messageAttachments } from '@/database/schema';
import { db } from '@/database/client';
import { eq, desc } from 'drizzle-orm';

export interface SSEClient {
  conversationId: string;
  userId: string;
  send: (data: string) => void;
}

// In-memory store for active connections
// In production, use Redis or similar for multi-instance support
const activeConnections = new Map<string, Set<SSEClient>>();

/**
 * Register a new SSE connection for a conversation
 */
export function registerConnection(client: SSEClient): void {
  const key = client.conversationId;
  if (!activeConnections.has(key)) {
    activeConnections.set(key, new Set());
  }
  activeConnections.get(key)!.add(client);
}

/**
 * Unregister an SSE connection
 */
export function unregisterConnection(client: SSEClient): void {
  const key = client.conversationId;
  const clients = activeConnections.get(key);
  if (clients) {
    clients.delete(client);
    if (clients.size === 0) {
      activeConnections.delete(key);
    }
  }
}

/**
 * Broadcast a message update to all connected clients in a conversation
 */
export async function broadcastMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const clients = activeConnections.get(conversationId);
  if (!clients || clients.size === 0) {
    return;
  }

  // Fetch the message with attachments and sender info
  const [message] = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!message) {
    return;
  }

  // Get attachments
  const attachments = await db
    .select()
    .from(messageAttachments)
    .where(eq(messageAttachments.messageId, messageId));

  // Get sender info
  const { users } = await import('@/database/schema');
  const [sender] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, message.senderId))
    .limit(1);

  const messageData = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: sender?.name || 'Unknown',
    senderEmail: sender?.email || '',
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    attachments: attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      storageName: att.storageName,
      storagePath: att.storagePath,
      mimeType: att.mimeType,
      fileSize: Number(att.fileSize),
      uploadedBy: att.uploadedBy,
      createdAt: att.createdAt.toISOString(),
    })),
  };

  // Send to all connected clients
  const data = `data: ${JSON.stringify(messageData)}\n\n`;
  clients.forEach((client) => {
    try {
      client.send(data);
    } catch (error) {
      // Connection might be closed, remove it
      console.error('Error sending SSE message:', error);
      unregisterConnection(client);
    }
  });
}

/**
 * Broadcast conversation update (e.g., new participant, title change)
 */
export async function broadcastConversationUpdate(
  conversationId: string,
  updateType: 'new_message' | 'participant_added' | 'participant_removed' | 'title_changed',
  data: any
): Promise<void> {
  const clients = activeConnections.get(conversationId);
  if (!clients || clients.size === 0) {
    return;
  }

  const updateData = {
    type: updateType,
    conversationId,
    data,
    timestamp: new Date().toISOString(),
  };

  const message = `data: ${JSON.stringify(updateData)}\n\n`;
  clients.forEach((client) => {
    try {
      client.send(message);
    } catch (error) {
      console.error('Error sending SSE update:', error);
      unregisterConnection(client);
    }
  });
}

/**
 * Get active connection count for a conversation (for debugging)
 */
export function getConnectionCount(conversationId: string): number {
  return activeConnections.get(conversationId)?.size || 0;
}

