'use client';

import { cn } from '@/lib/utils';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [openAbove, setOpenAbove] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      // Estimate dropdown height (approximate: ~40px per item + padding)
      const estimatedDropdownHeight = items.length * 40 + 16; // 16px for py-1 padding
      const gap = 8; // Gap between trigger and dropdown
      
      // Check if there's enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
      
      setOpenAbove(shouldOpenAbove);
      
      // Calculate position
      if (shouldOpenAbove) {
        // Position above the trigger
        setPosition({
          top: rect.top + window.scrollY - estimatedDropdownHeight - gap,
          left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
          right: align === 'right' ? window.innerWidth - rect.right - window.scrollX : 0,
          bottom: 0,
        });
      } else {
        // Position below the trigger (default)
        setPosition({
          top: rect.bottom + window.scrollY + gap,
          left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
          right: align === 'right' ? window.innerWidth - rect.right - window.scrollX : 0,
          bottom: 0,
        });
      }
    }
  }, [isOpen, align, items.length]);
  
  // Recalculate position after dropdown is rendered to get actual height
  useEffect(() => {
    if (isOpen && dropdownRef.current && triggerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (!dropdownRef.current || !triggerRef.current) return;
        
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const actualDropdownHeight = dropdownRect.height;
        const gap = 8;
        
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const shouldOpenAbove = spaceBelow < actualDropdownHeight && spaceAbove > spaceBelow;
        
        setOpenAbove(shouldOpenAbove);
        
        if (shouldOpenAbove) {
          setPosition(prev => ({
            ...prev,
            top: triggerRect.top + window.scrollY - actualDropdownHeight - gap,
          }));
        } else {
          setPosition(prev => ({
            ...prev,
            top: triggerRect.bottom + window.scrollY + gap,
          }));
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const dropdownMenu = isOpen && (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-[9999] w-48 rounded-md shadow-lg bg-bg-primary border border-border',
        'py-1'
      )}
      style={{
        top: `${position.top}px`,
        ...(align === 'right' 
          ? { right: `${position.right}px` }
          : { left: `${position.left}px` }
        ),
      }}
      role="menu"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            'w-full text-left px-4 py-2 text-sm transition-colors',
            item.disabled
              ? 'text-text-muted cursor-not-allowed'
              : item.variant === 'danger'
              ? 'text-danger hover:bg-danger hover:bg-opacity-10'
              : 'text-text-primary hover:bg-bg-secondary',
            'flex items-center gap-2'
          )}
          role="menuitem"
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      <div 
        ref={triggerRef}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {trigger}
      </div>

      {/* Render dropdown menu in portal to avoid overflow issues */}
      {typeof window !== 'undefined' && isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
}



