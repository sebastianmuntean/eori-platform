'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minHeight?: string;
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = '<html>...</html>',
  error,
  minHeight = '400px',
}: HtmlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [viewMode, setViewMode] = useState<'source' | 'design' | 'split'>('source');

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let newText = '';
    if (selectedText) {
      // If text is selected, wrap it
      newText = before + text.replace('{{SELECTED}}', selectedText) + after;
    } else {
      // Insert at cursor position
      newText = before + text + after;
    }

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertTag = (openTag: string, closeTag?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let newText = '';
    if (selectedText) {
      // Wrap selected text
      newText = before + openTag + selectedText + (closeTag || '') + after;
    } else {
      // Insert tag with placeholder
      newText = before + openTag + (closeTag ? '{{SELECTED}}' + closeTag : '') + after;
    }

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
      } else {
        const newPosition = start + openTag.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const insertVariable = (variable: string) => {
    insertAtCursor(`{{${variable}}}`);
  };

  const toolbarButtons = [
    {
      label: 'Bold',
      icon: 'B',
      onClick: () => insertTag('<strong>', '</strong>'),
      title: 'Bold (Ctrl+B)',
    },
    {
      label: 'Italic',
      icon: 'I',
      onClick: () => insertTag('<em>', '</em>'),
      title: 'Italic (Ctrl+I)',
    },
    {
      label: 'Underline',
      icon: 'U',
      onClick: () => insertTag('<u>', '</u>'),
      title: 'Underline',
    },
    {
      label: 'Paragraph',
      icon: 'P',
      onClick: () => insertTag('<p>', '</p>'),
      title: 'Paragraph',
    },
    {
      label: 'Heading 1',
      icon: 'H1',
      onClick: () => insertTag('<h1>', '</h1>'),
      title: 'Heading 1',
    },
    {
      label: 'Heading 2',
      icon: 'H2',
      onClick: () => insertTag('<h2>', '</h2>'),
      title: 'Heading 2',
    },
    {
      label: 'Heading 3',
      icon: 'H3',
      onClick: () => insertTag('<h3>', '</h3>'),
      title: 'Heading 3',
    },
    {
      label: 'Div',
      icon: 'DIV',
      onClick: () => insertTag('<div>', '</div>'),
      title: 'Div',
    },
    {
      label: 'Link',
      icon: '🔗',
      onClick: () => insertTag('<a href="">', '</a>'),
      title: 'Link',
    },
    {
      label: 'Image',
      icon: '🖼️',
      onClick: () => insertTag('<img src="" alt="" />', ''),
      title: 'Image',
    },
    {
      label: 'Table',
      icon: '📊',
      onClick: () => {
        const table = `<table>
  <tr>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
  </tr>
</table>`;
        insertAtCursor(table);
      },
      title: 'Table',
    },
    {
      label: 'List',
      icon: '📋',
      onClick: () => insertTag('<ul>\n  <li>', '</li>\n</ul>'),
      title: 'Unordered List',
    },
    {
      label: 'HR',
      icon: '─',
      onClick: () => insertTag('<hr />', ''),
      title: 'Horizontal Rule',
    },
    {
      label: 'BR',
      icon: '↵',
      onClick: () => insertTag('<br />', ''),
      title: 'Line Break',
    },
  ];

  const commonVariables = [
    { label: 'User Name', value: 'user.name' },
    { label: 'User Email', value: 'user.email' },
    { label: 'App Name', value: 'app.name' },
    { label: 'Confirmation Link', value: 'link.confirmation' },
    { label: 'Reset Link', value: 'link.reset' },
    { label: 'Form Name', value: 'form.name' },
    { label: 'Code', value: 'code' },
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      {showToolbar && (
        <div className="border border-border rounded-t-md bg-bg-secondary p-2 flex flex-wrap gap-2">
          {/* HTML Tags */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <span className="text-xs text-text-secondary font-medium mr-1">Taguri:</span>
            {toolbarButtons.map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={btn.onClick}
                title={btn.title}
                className="px-2 py-1 text-xs bg-bg-primary hover:bg-bg-tertiary border border-border rounded text-text-primary transition-colors"
              >
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Variables */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <span className="text-xs text-text-secondary font-medium mr-1">Variabile:</span>
            {commonVariables.map((variable, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertVariable(variable.value)}
                title={variable.label}
                className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-primary transition-colors"
              >
                {`{{${variable.value}}}`}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <span className="text-xs text-text-secondary font-medium mr-1">Vizualizare:</span>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'source'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary hover:bg-bg-tertiary text-text-primary border border-border'
              }`}
              title="Mod Source"
            >
              Source
            </button>
            <button
              type="button"
              onClick={() => setViewMode('design')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'design'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary hover:bg-bg-tertiary text-text-primary border border-border'
              }`}
              title="Mod Design"
            >
              Design
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary hover:bg-bg-tertiary text-text-primary border border-border'
              }`}
              title="Split View"
            >
              Split
            </button>
          </div>

          {/* Toggle Toolbar */}
          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            className="ml-auto px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            title="Ascunde/Arată toolbar"
          >
            {showToolbar ? '▲' : '▼'}
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        {viewMode === 'source' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm ${
              !showToolbar ? 'rounded-t-md' : 'rounded-b-md rounded-t-none'
            }`}
            style={{ minHeight }}
            spellCheck={false}
          />
        )}

        {viewMode === 'design' && (
          <div
            className={`w-full px-4 py-2 border border-border rounded-md bg-bg-primary overflow-auto ${
              !showToolbar ? 'rounded-t-md' : 'rounded-b-md rounded-t-none'
            }`}
            style={{ minHeight }}
          >
            <iframe
              srcDoc={value}
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
              title="HTML Preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className={`grid grid-cols-2 gap-2 border border-border rounded-md bg-bg-primary p-2 ${
            !showToolbar ? 'rounded-t-md' : 'rounded-b-md rounded-t-none'
          }`}>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-full px-4 py-2 border border-border rounded bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm resize-none"
                style={{ minHeight: '500px' }}
                spellCheck={false}
              />
            </div>
            <div className="relative border-l border-border pl-2">
              <div className="overflow-auto" style={{ minHeight: '500px' }}>
                <iframe
                  srcDoc={value}
                  className="w-full h-full border-0"
                  style={{ minHeight: '500px' }}
                  title="HTML Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>

      {/* Character count */}
      <div className="text-xs text-text-secondary flex justify-between">
        <span>{value.length} caractere</span>
        <span>{value.split('\n').length} linii</span>
      </div>
    </div>
  );
}

