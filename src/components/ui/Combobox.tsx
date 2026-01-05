'use client';

import { useState, useRef, useEffect } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  name: string;
  label?: string;
  placeholder?: string;
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string, option?: ComboboxOption) => void;
  onCreateNew?: (name: string) => Promise<ComboboxOption | null>;
  createLabel?: string; // e.g., "Create category" or "Create vendor"
  disabled?: boolean;
  required?: boolean;
}

export function Combobox({
  name,
  label,
  placeholder = 'Search or create...',
  options,
  value,
  onChange,
  onCreateNew,
  createLabel = 'Create',
  disabled = false,
  required = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected option's label
  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches any existing option exactly
  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === search.toLowerCase()
  );

  // Show create option if search has value and no exact match
  const showCreateOption = search.trim() && !exactMatch && onCreateNew;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search to selected value when closing
        if (selectedOption) {
          setSearch('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (option: ComboboxOption) => {
    onChange?.(option.value, option);
    setSearch('');
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    if (!onCreateNew || !search.trim()) return;

    setCreating(true);
    try {
      const newOption = await onCreateNew(search.trim());
      if (newOption) {
        onChange?.(newOption.value, newOption);
        setSearch('');
        setIsOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    onChange?.('', undefined);
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : (selectedOption?.label || '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
                     dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100
                     dark:placeholder-gray-500 dark:disabled:bg-gray-900"
        />

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={value || ''} />

        {/* Clear button or dropdown arrow */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg
                        dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-auto">
          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={creating}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-primary-600
                         hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20
                         border-b border-gray-200 dark:border-gray-700"
            >
              {creating ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <span>{createLabel} &quot;{search}&quot;</span>
            </button>
          )}

          {/* Existing options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                           ${option.value === value ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                {option.value === value && (
                  <svg className="float-right h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))
          ) : (
            !showCreateOption && (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                No options found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
