'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { UserSelectionModal } from './UserSelectionModal';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';
import { useChatContext } from '@/contexts/ChatContext';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

export function FloatingChatWindow() {
  const { isOpen, closeChat } = useChatContext();
  const { user } = useUser();
  const { toasts, removeToast, error: showErrorToast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddToConversation, setShowAddToConversation] = useState(false);
  const [accessFullHistory, setAccessFullHistory] = useState(false);
  const [addingParticipants, setAddingParticipants] = useState(false);

  const { conversations, loading: conversationsLoading, fetchConversations, createConversation } = useConversations();
  const {
    messages,
    loading: messagesLoading,
    sending,
    hasMore,
    sendMessage,
    sendMessageWithFiles,
    loadMore,
  } = useChat(selectedConversationId);

  // Fetch conversations when opening history
  useEffect(() => {
    if (isOpen && showHistory) {
      fetchConversations();
    }
  }, [isOpen, showHistory, fetchConversations]);

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      if (!selectedConversationId) {
        // Cannot send message without a conversation
        return;
      }

      if (files.length > 0) {
        await sendMessageWithFiles(files, content || undefined);
      } else if (content.trim()) {
        await sendMessage(content);
      }
    },
    [selectedConversationId, sendMessage, sendMessageWithFiles]
  );

  const handleAddParticipantsToConversation = async (userIds: string[]) => {
    if (!selectedConversationId || userIds.length === 0) return;

    setAddingParticipants(true);
    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversationId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: userIds,
          accessFullHistory,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add participants');
      }

      setShowAddToConversation(false);
      setAccessFullHistory(false);
      // Refresh conversations to get updated participant list
      fetchConversations();
    } catch (error) {
      console.error('Error adding participants:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to add participants');
    } finally {
      setAddingParticipants(false);
    }
  };

  const handleStartConversation = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const conversation = await createConversation({
        type: userIds.length === 1 ? 'direct' : 'group',
        participantIds: userIds,
      });

      if (conversation) {
        setSelectedConversationId(conversation.id);
        setShowAddUsers(false);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to create conversation');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowHistory(false);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Get user IDs to exclude in modals
  const excludeUserIdsForNewConversation = user ? [user.id] : [];
  const excludeUserIdsForExistingConversation = selectedConversation
    ? [user?.id || '', ...selectedConversation.participants.map(p => p.userId)].filter(Boolean)
    : excludeUserIdsForNewConversation;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 w-[500px] h-[700px] bg-bg-primary border border-border rounded-lg shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedConversationId) {
                  setShowAddToConversation(true);
                } else {
                  setShowAddUsers(true);
                }
              }}
              aria-label={selectedConversationId ? "Add users to conversation" : "Add users to chat"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
            {selectedConversation && (
              <span className="text-sm font-medium text-text-primary">
                {selectedConversation.title ||
                  selectedConversation.participants
                    .filter((p) => p.userId !== user?.id)
                    .map((p) => p.userName)
                    .join(', ') ||
                  'Chat'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              aria-label="Conversation history"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selectedConversationId ? (
            <>
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
              Click + to add users and start chatting
            </div>
          )}
        </div>
      </div>

      {/* Add Users to Conversation Modal */}
      <UserSelectionModal
        isOpen={showAddToConversation}
        onClose={() => {
          setShowAddToConversation(false);
          setAccessFullHistory(false);
        }}
        onConfirm={handleAddParticipantsToConversation}
        title={selectedConversation?.title ? `Add Users to "${selectedConversation.title}"` : 'Add Users to Conversation'}
        confirmButtonText="Add Users"
        showAccessFullHistory={true}
        accessFullHistory={accessFullHistory}
        onAccessFullHistoryChange={setAccessFullHistory}
        excludeUserIds={excludeUserIdsForExistingConversation}
        loading={addingParticipants}
      />

      {/* Add Users Modal (New Conversation) */}
      <UserSelectionModal
        isOpen={showAddUsers}
        onClose={() => setShowAddUsers(false)}
        onConfirm={handleStartConversation}
        title="Add Users to Chat"
        confirmButtonText="Start Chat"
        excludeUserIds={excludeUserIdsForNewConversation}
        loading={conversationsLoading}
      />

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Conversation History"
        size="lg"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {conversationsLoading ? (
            <div className="text-center py-4 text-text-muted">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-4 text-text-muted">No conversations yet</div>
          ) : (
            conversations.map(conv => {
              const title = conv.title ||
                conv.participants
                  .filter((p) => p.userId !== user?.id)
                  .map((p) => p.userName)
                  .join(', ') ||
                'Untitled';

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-md hover:bg-bg-secondary transition-colors border border-border',
                    selectedConversationId === conv.id && 'bg-primary/20 border-primary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">{title}</div>
                      {conv.lastMessage && (
                        <div className="text-sm text-text-muted truncate">
                          {conv.lastMessage.content || 'Attachment'}
                        </div>
                      )}
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <Badge variant="primary" size="sm" className="ml-2">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Modal>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
