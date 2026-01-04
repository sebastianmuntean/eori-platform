'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { ChatMessage } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  loading = false,
  hasMore = false,
  onLoadMore,
  className,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      {hasMore && onLoadMore && (
        <div className="p-2 border-b border-border text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more messages'}
          </Button>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-text-muted">
            No messages yet. Start the conversation!
          </div>
        )}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-muted">
            Loading messages...
          </div>
        )}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

