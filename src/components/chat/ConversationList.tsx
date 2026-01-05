'use client';

import { useState } from 'react';
import { Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/SearchInput';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import { Badge } from '@/components/ui/Badge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading?: boolean;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading = false,
  className,
}: ConversationListProps) {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const title = conv.title?.toLowerCase() || '';
    const participantNames = conv.participants
      .filter((p) => p.userId !== user?.id)
      .map((p) => p.userName.toLowerCase())
      .join(' ');

    return title.includes(searchLower) || participantNames.includes(searchLower);
  });

  const getConversationTitle = (conv: Conversation): string => {
    if (conv.title) return conv.title;

    // For direct conversations, show other participant's name
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
      return otherParticipant?.userName || 'Unknown User';
    }

    return 'Untitled Group';
  };

  const getConversationPreview = (conv: Conversation): string => {
    if (conv.lastMessage) {
      return conv.lastMessage.content || 'Attachment';
    }
    return 'No messages yet';
  };

  return (
    <div className={cn('flex flex-col h-full border-r border-border bg-bg-primary', className)}>
      <div className="p-4 border-b border-border">
        <SearchInput
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          placeholder="Search conversations..."
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4 text-center text-text-muted">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-text-muted">
            {searchTerm ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              const title = getConversationTitle(conv);
              const preview = getConversationPreview(conv);
              const time = conv.lastMessage
                ? format(new Date(conv.lastMessage.createdAt), 'HH:mm')
                : '';

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left border-b border-border hover:bg-bg-secondary transition-colors',
                    isSelected && 'bg-bg-secondary border-l-4 border-l-primary'
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary truncate">{title}</span>
                        {conv.unreadCount && conv.unreadCount > 0 && (
                          <Badge variant="primary" size="sm">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {time && (
                      <span className="text-xs text-text-muted ml-2 flex-shrink-0">{time}</span>
                    )}
                  </div>
                  <div className="text-sm text-text-muted truncate">{preview}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

