'use client';

import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChat';
import { AttachmentPreview } from './AttachmentPreview';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';

interface MessageItemProps {
  message: ChatMessage;
  className?: string;
}

export function MessageItem({ message, className }: MessageItemProps) {
  const { user } = useUser();
  const isOwn = user?.id === message.senderId;
  const formattedTime = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div
      className={cn('flex mb-4', isOwn ? 'justify-end' : 'justify-start', className)}
    >
      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <div className="text-xs text-text-muted mb-1 px-2">{message.senderName}</div>
        )}
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isOwn
              ? 'bg-primary text-white'
              : 'bg-bg-secondary text-text-primary border border-border'
          )}
        >
          {message.content && (
            <div className={cn('text-sm mb-2', isOwn ? 'text-white' : 'text-text-primary')}>
              {message.content}
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="max-w-xs">
                  <a
                    href={`/api/chat/files/${encodeURIComponent(attachment.storageName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <AttachmentPreview
                      fileName={attachment.fileName}
                      mimeType={attachment.mimeType}
                      fileSize={attachment.fileSize}
                      storagePath={attachment.storagePath}
                      storageName={attachment.storageName}
                    />
                  </a>
                </div>
              ))}
            </div>
          )}
          <div className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-text-muted')}>
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
}

