'use client';

import { useState, useCallback, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversations();
  const {
    messages,
    loading: messagesLoading,
    sending,
    hasMore,
    sendMessage,
    sendMessageWithFiles,
    loadMore,
  } = useChat(selectedConversationId);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      if (!selectedConversationId) return;

      if (files.length > 0) {
        await sendMessageWithFiles(files, content || undefined);
      } else if (content.trim()) {
        await sendMessage(content);
      }
    },
    [selectedConversationId, sendMessage, sendMessageWithFiles]
  );

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className={cn('flex h-full bg-bg-primary', className)}>
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          loading={conversationsLoading}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <>
            <div className="border-b border-border px-4 py-3 bg-bg-primary">
              <h2 className="text-lg font-semibold text-text-primary">
                {selectedConversation?.title ||
                  selectedConversation?.participants
                    .filter((p) => p.userId !== selectedConversation?.createdBy)
                    .map((p) => p.userName)
                    .join(', ') ||
                  'Chat'}
              </h2>
            </div>
            <MessageList
              messages={messages}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
            <MessageComposer onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

