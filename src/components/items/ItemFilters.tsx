'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Select, Button } from '@/components/ui';
import type { CategoryWithCount } from '@/lib/types/database';

interface ItemFiltersProps {
  categories: CategoryWithCount[];
  locations: string[];
  currentFilters: {
    category?: string;
    location?: string;
    tracking_mode?: string;
    low_stock?: boolean;
    q?: string;
  };
  basePath?: string;
}

export function ItemFilters({ categories, locations, currentFilters, basePath = '/' }: ItemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with URL params when they change externally
  useEffect(() => {
    setSearchQuery(currentFilters.q || '');
  }, [currentFilters.q]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  }, [searchParams, router, basePath]);

  // Debounced search update
  const updateSearch = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateFilter('q', value || null);
    }, 300);
  }, [updateFilter]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    updateFilter('q', null);
    searchInputRef.current?.focus();
  };

  const clearFilters = () => {
    setSearchQuery('');
    router.push(basePath);
  };

  const hasFilters =
    currentFilters.category ||
    currentFilters.location ||
    currentFilters.tracking_mode ||
    currentFilters.low_stock ||
    currentFilters.q;

  return (
    <div className="flex flex-col gap-3">
      {/* Search input - primary filter */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search inventory... (⌘K)"
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-500 dark:text-gray-100"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {/* Category filter */}
          <Select
          value={currentFilters.category || ''}
          onChange={(e) => updateFilter('category', e.target.value || null)}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.item_count})`,
            })),
          ]}
          className="w-full sm:w-auto sm:min-w-[160px]"
        />

        {/* Location filter */}
        <Select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value || null)}
          options={[
            { value: '', label: 'All Locations' },
            ...locations.map((loc) => ({
              value: loc,
              label: loc,
            })),
          ]}
          className="w-full sm:w-auto sm:min-w-[160px]"
        />

        {/* Tracking mode filter */}
        <Select
          value={currentFilters.tracking_mode || ''}
          onChange={(e) => updateFilter('tracking_mode', e.target.value || null)}
          options={[
            { value: '', label: 'All Types' },
            { value: 'quantity', label: 'Quantity-based' },
            { value: 'individual', label: 'Individual items' },
          ]}
          className="w-full sm:w-auto sm:min-w-[140px]"
        />

        {/* Low stock toggle */}
        <button
          onClick={() => updateFilter('low_stock', currentFilters.low_stock ? null : 'true')}
          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors touch-manipulation ${
            currentFilters.low_stock
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Low Stock
          </span>
        </button>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start sm:self-auto">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
