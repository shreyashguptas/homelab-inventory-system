'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
}

export function ItemFilters({ categories, locations, currentFilters }: ItemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`/items?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/items');
  };

  const hasFilters =
    currentFilters.category ||
    currentFilters.location ||
    currentFilters.tracking_mode ||
    currentFilters.low_stock ||
    currentFilters.q;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
      {/* Filter dropdowns row */}
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
  );
}
