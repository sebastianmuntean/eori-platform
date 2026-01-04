'use client';

import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  storagePath: string;
  onRemove?: () => void;
  className?: string;
}

export function AttachmentPreview({
  fileName,
  mimeType,
  fileSize,
  storagePath,
  onRemove,
  className,
}: AttachmentPreviewProps) {
  const isImage = mimeType?.startsWith('image/');
  const fileSizeKB = Math.round(fileSize / 1024);

  return (
    <div
      className={cn(
        'relative border border-border rounded-md overflow-hidden bg-bg-secondary',
        className
      )}
    >
      {isImage ? (
        <img
          src={`/api/chat/files/${encodeURIComponent(storagePath.split('/').pop() || '')}`}
          alt={fileName}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="p-4 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto text-text-muted mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-text-primary truncate max-w-[150px]">{fileName}</p>
            <p className="text-xs text-text-muted">{fileSizeKB} KB</p>
          </div>
        </div>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-opacity"
          aria-label="Remove attachment"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

