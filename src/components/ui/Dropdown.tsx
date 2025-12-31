'use client';

import { cn } from '@/lib/utils';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownItem {
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
  console.log('Step 1: Rendering Dropdown component, align:', align);
  
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [openAbove, setOpenAbove] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      console.log('Step 2: Calculating dropdown position');
      const rect = triggerRef.current.getBoundingClientRect();
      
      // Estimate dropdown height (approximate: ~40px per item + padding)
      const estimatedDropdownHeight = items.length * 40 + 16; // 16px for py-1 padding
      const gap = 8; // Gap between trigger and dropdown
      
      // Check if there's enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
      
      console.log(`  Space below: ${spaceBelow}px, Space above: ${spaceAbove}px, Estimated height: ${estimatedDropdownHeight}px`);
      console.log(`  Should open above: ${shouldOpenAbove}`);
      
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
      console.log('✓ Position calculated');
    }
  }, [isOpen, align, items.length]);
  
  // Recalculate position after dropdown is rendered to get actual height
  useEffect(() => {
    if (isOpen && dropdownRef.current && triggerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (!dropdownRef.current || !triggerRef.current) return;
        
        console.log('Step 2.1: Recalculating position with actual dropdown height');
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
        console.log('Step 3: Click outside dropdown, closing');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      console.log('✓ Click outside listener added');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      console.log('✓ Click outside listener removed');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('Step 4: Escape key pressed, closing dropdown');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      console.log('✓ Escape key listener added');
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      console.log('✓ Escape key listener removed');
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    console.log('Step 5: Dropdown item clicked:', item.label);
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
      console.log('✓ Dropdown item action executed and dropdown closed');
    }
  };

  console.log('✓ Rendering dropdown');

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
          console.log('Step 6: Toggling dropdown');
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



