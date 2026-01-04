'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface AutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  onSearch?: (searchTerm: string) => void;
  className?: string;
  disabled?: boolean;
  getOptionLabel?: (option: AutocompleteOption) => string;
}

export function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  helperText,
  loading = false,
  onSearch,
  className,
  disabled = false,
  getOptionLabel = (option) => option.label,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const onSearchRef = useRef(onSearch);
  const generatedId = useId();
  const inputId = `autocomplete-${generatedId}`;
  const hasError = !!error;

  // Keep onSearch ref up to date (without triggering re-renders)
  onSearchRef.current = onSearch;

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  // Find selected option
  const selectedOption = options.find((opt) => getOptionLabel(opt) === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search with debouncing - only trigger when searchTerm actually changes
  const prevSearchTermRef = useRef<string>('');
  useEffect(() => {
    // Trim search term to handle spaces
    const trimmedSearch = searchTerm.trim();
    // Only trigger if searchTerm actually changed and is different from previous
    if (onSearchRef.current && trimmedSearch && trimmedSearch.length >= 3 && searchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = searchTerm;
      const timeoutId = setTimeout(() => {
        // Double check that searchTerm hasn't changed during timeout
        if (searchTerm === prevSearchTermRef.current) {
          onSearchRef.current?.(searchTerm.trim());
        }
      }, 500); // Debounce search - increased to 500ms
      return () => clearTimeout(timeoutId);
    } else if (searchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = searchTerm;
    }
  }, [searchTerm]); // Only depend on searchTerm to prevent infinite loop

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm && value && value !== searchTerm) {
      setSearchTerm(value);
    }
  };

  const handleSelectOption = (option: AutocompleteOption) => {
    const label = getOptionLabel(option);
    onChange(label);
    if (label !== searchTerm) {
      setSearchTerm(label);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length === 1) {
          handleSelectOption(filteredOptions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const displayValue = isOpen ? searchTerm : (selectedOption ? getOptionLabel(selectedOption) : value);

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2 border rounded-md transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'border-danger focus:ring-danger'
              : 'border-border focus:ring-primary focus:border-primary',
            'bg-bg-primary text-text-primary placeholder:text-text-muted',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-invalid={hasError}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="animate-spin h-5 w-5 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {isOpen && filteredOptions.length > 0 && !loading && (
          <ul
            ref={listRef}
            id={`${inputId}-listbox`}
            role="listbox"
            className={cn(
              'absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md',
              'bg-bg-primary border border-border shadow-lg',
              'py-1'
            )}
          >
            {filteredOptions.map((option, index) => {
              const optionLabel = getOptionLabel(option);
              const isHighlighted = index === highlightedIndex;
              const isSelected = optionLabel === value;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'px-4 py-2 cursor-pointer transition-colors',
                    isHighlighted
                      ? 'bg-bg-secondary'
                      : isSelected
                      ? 'bg-bg-secondary bg-opacity-50'
                      : 'hover:bg-bg-secondary'
                  )}
                >
                  {optionLabel}
                </li>
              );
            })}
          </ul>
        )}
        {isOpen && filteredOptions.length === 0 && !loading && searchTerm && (
          <ul
            className={cn(
              'absolute z-50 w-full mt-1 rounded-md',
              'bg-bg-primary border border-border shadow-lg',
              'py-1'
            )}
          >
            <li className="px-4 py-2 text-text-muted text-sm">
              Nu s-au găsit rezultate
            </li>
          </ul>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
}

