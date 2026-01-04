import { db } from '@/database/client';
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  users,
} from '@/database/schema';
import { eq, and, or, desc, asc, sql, inArray, gt, ne, lt } from 'drizzle-orm';

export interface CreateConversationParams {
  userId: string;
  type: 'direct' | 'group';
  participantIds: string[]; // For direct: 1 other user, for group: multiple users
  title?: string; // Required for groups
}

export interface ConversationWithParticipants {
  id: string;
  title: string | null;
  type: 'direct' | 'group';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    joinedAt: Date;
    lastReadAt: Date | null;
  }>;
  lastMessage?: {
    id: string;
    content: string | null;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  unreadCount?: number;
}

export interface MessageWithAttachments {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: Array<{
    id: string;
    fileName: string;
    storageName: string;
    storagePath: string;
    mimeType: string | null;
    fileSize: number;
    uploadedBy: string;
    createdAt: Date;
  }>;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  params: CreateConversationParams
): Promise<{ id: string }> {
  const { userId, type, participantIds, title } = params;

  if (type === 'direct' && participantIds.length !== 1) {
    throw new Error('Direct conversations must have exactly one other participant');
  }

  if (type === 'group' && !title) {
    throw new Error('Group conversations must have a title');
  }

  if (type === 'group' && participantIds.length < 2) {
    throw new Error('Group conversations must have at least 2 participants');
  }

  // Check if direct conversation already exists
  if (type === 'direct') {
    const existingConversation = await findDirectConversation(userId, participantIds[0]);
    if (existingConversation) {
      return { id: existingConversation.id };
    }
  }

  // Create conversation
  const [newConversation] = await db
    .insert(conversations)
    .values({
      type,
      title: title || null,
      createdBy: userId,
    })
    .returning();

  // Add participants (including creator)
  const allParticipantIds = [userId, ...participantIds];
  await db.insert(conversationParticipants).values(
    allParticipantIds.map((participantId) => ({
      conversationId: newConversation.id,
      userId: participantId,
    }))
  );

  return { id: newConversation.id };
}

/**
 * Find existing direct conversation between two users
 */
export async function findDirectConversation(
  userId1: string,
  userId2: string
): Promise<{ id: string } | null> {
  const result = await db
    .select({ id: conversations.id })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId)
    )
    .where(
      and(
        eq(conversations.type, 'direct'),
        inArray(conversationParticipants.userId, [userId1, userId2])
      )
    )
    .groupBy(conversations.id)
    .having(sql`COUNT(DISTINCT ${conversationParticipants.userId}) = 2`)
    .limit(1);

  return result[0] || null;
}

/**
 * Get user's conversations with pagination
 */
export async function getUserConversations(
  userId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{
  conversations: ConversationWithParticipants[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // Get conversation IDs user is part of
  const userConversationIds = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));

  const conversationIds = userConversationIds.map((c) => c.conversationId);

  if (conversationIds.length === 0) {
    return {
      conversations: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(conversations)
    .where(inArray(conversations.id, conversationIds));
  const total = Number(totalCountResult[0]?.count || 0);

  // Get conversations with participants
  const conversationsData = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      type: conversations.type,
      createdBy: conversations.createdBy,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(inArray(conversations.id, conversationIds))
    .orderBy(desc(conversations.updatedAt))
    .limit(pageSize)
    .offset(offset);

  // Get participants for each conversation
  const conversationWithParticipants: ConversationWithParticipants[] = await Promise.all(
    conversationsData.map(async (conv) => {
      const participantsData = await db
        .select({
          id: conversationParticipants.id,
          userId: conversationParticipants.userId,
          joinedAt: conversationParticipants.joinedAt,
          lastReadAt: conversationParticipants.lastReadAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(conversationParticipants)
        .innerJoin(users, eq(conversationParticipants.userId, users.id))
        .where(eq(conversationParticipants.conversationId, conv.id));

      // Get last message
      const [lastMessage] = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          senderName: users.name,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get unread count for this user
      const userParticipant = participantsData.find((p) => p.userId === userId);
      const lastReadAt = userParticipant?.lastReadAt;

      let unreadCount = 0;
      if (lastReadAt) {
        const unreadResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              gt(messages.createdAt, lastReadAt)
            )
          );
        unreadCount = Number(unreadResult[0]?.count || 0);
      } else {
        // If never read, count all messages except own
        const unreadResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              ne(messages.senderId, userId)
            )
          );
        unreadCount = Number(unreadResult[0]?.count || 0);
      }

      return {
        ...conv,
        participants: participantsData.map((p) => ({
          id: p.id,
          userId: p.userId,
          userName: p.userName,
          userEmail: p.userEmail,
          joinedAt: p.joinedAt,
          lastReadAt: p.lastReadAt,
        })),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: lastMessage.senderName,
              createdAt: lastMessage.createdAt,
            }
          : undefined,
        unreadCount,
      };
    })
  );

  return {
    conversations: conversationWithParticipants,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get conversation by ID with participants
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationWithParticipants | null> {
  // Check if user is participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1);

  if (!participant) {
    return null;
  }

  // Get conversation
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) {
    return null;
  }

  // Get participants
  const participantsData = await db
    .select({
      id: conversationParticipants.id,
      userId: conversationParticipants.userId,
      joinedAt: conversationParticipants.joinedAt,
      lastReadAt: conversationParticipants.lastReadAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(eq(conversationParticipants.conversationId, conversationId));

  return {
    ...conv,
    participants: participantsData.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.userName,
      userEmail: p.userEmail,
      joinedAt: p.joinedAt,
      lastReadAt: p.lastReadAt,
    })),
  };
}

/**
 * Create a new message
 */
export async function createMessage(
  conversationId: string,
  senderId: string,
  content: string | null
): Promise<{ id: string }> {
  // Verify user is participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, senderId)
      )
    )
    .limit(1);

  if (!participant) {
    throw new Error('User is not a participant in this conversation');
  }

  // Create message
  const [newMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId,
      content: content || null,
    })
    .returning();

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return { id: newMessage.id };
}

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  options: { page?: number; pageSize?: number; beforeMessageId?: string } = {}
): Promise<{
  messages: MessageWithAttachments[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}> {
  // Verify user is participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1);

  if (!participant) {
    throw new Error('User is not a participant in this conversation');
  }

  const page = options.page || 1;
  const pageSize = options.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  const total = Number(totalCountResult[0]?.count || 0);

  // Build query
  let query = db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
      senderName: users.name,
      senderEmail: users.email,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId));

  // Add beforeMessageId filter if provided
  if (options.beforeMessageId) {
    const [beforeMessage] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, options.beforeMessageId!))
      .limit(1);

    if (beforeMessage) {
      query = query.where(
        and(
          eq(messages.conversationId, conversationId),
          lt(messages.createdAt, beforeMessage.createdAt)
        )
      );
    }
  }

  const messagesData = await query
    .orderBy(desc(messages.createdAt))
    .limit(pageSize + 1) // Fetch one extra to check if there's more
    .offset(offset);

  const hasMore = messagesData.length > pageSize;
  const messagesToReturn = hasMore ? messagesData.slice(0, pageSize) : messagesData;

  // Get attachments for each message
  const messagesWithAttachments: MessageWithAttachments[] = await Promise.all(
    messagesToReturn.map(async (msg) => {
      const attachments = await db
        .select()
        .from(messageAttachments)
        .where(eq(messageAttachments.messageId, msg.id))
        .orderBy(asc(messageAttachments.createdAt));

      return {
        ...msg,
        attachments: attachments.map((att) => ({
          id: att.id,
          fileName: att.fileName,
          storageName: att.storageName,
          storagePath: att.storagePath,
          mimeType: att.mimeType,
          fileSize: Number(att.fileSize),
          uploadedBy: att.uploadedBy,
          createdAt: att.createdAt,
        })),
      };
    })
  );

  // Reverse to show oldest first
  messagesWithAttachments.reverse();

  return {
    messages: messagesWithAttachments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore,
  };
}

/**
 * Mark conversation as read for a user
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    );
}

/**
 * Add participants to an existing conversation
 */
export async function addParticipantsToConversation(
  conversationId: string,
  participantIds: string[],
  accessFullHistory: boolean = false
): Promise<void> {
  // Get conversation to check type and get creation date
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Check if participants already exist
  const existingParticipants = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        inArray(conversationParticipants.userId, participantIds)
      )
    );

  const existingUserIds = new Set(existingParticipants.map(p => p.userId));
  const newParticipantIds = participantIds.filter(id => !existingUserIds.has(id));

  if (newParticipantIds.length === 0) {
    throw new Error('All users are already participants');
  }

  // Determine lastReadAt based on accessFullHistory
  // If full history access: set to conversation creation date
  // If only new messages: set to current time
  const lastReadAt = accessFullHistory ? conversation.createdAt : new Date();

  // Add new participants
  await db.insert(conversationParticipants).values(
    newParticipantIds.map((participantId) => ({
      conversationId,
      userId: participantId,
      lastReadAt,
    }))
  );

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

