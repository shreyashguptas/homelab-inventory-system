'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, Badge } from '@/components/ui';
import type { Item } from '@/lib/types/database';

interface ItemCardProps {
  item: Item;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
}

export function ItemCard({ item, selectable = false, selected = false, onSelectionChange }: ItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const isLowStock =
    item.tracking_mode === 'quantity' &&
    item.min_quantity > 0 &&
    quantity <= item.min_quantity;

  const handleQuantityChange = async (delta: number) => {
    if (updating) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });

      if (res.ok) {
        const updated = await res.json();
        setQuantity(updated.quantity);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(item.id, e.target.checked);
  };

  return (
    <Card hover className={`flex flex-col relative ${selected ? 'ring-2 ring-primary-500' : ''}`}>
      {selectable && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500
                       dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
          />
        </div>
      )}
      <Link href={`/items/${item.id}`} className="flex-1">
        <div className={`p-4 ${selectable ? 'pl-10' : ''}`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {item.name}
            </h3>
            {isLowStock && (
              <Badge variant="danger" size="sm">
                Low
              </Badge>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            {item.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                {item.location}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Footer with quantity controls */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
        {item.tracking_mode === 'quantity' ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {quantity} {item.unit}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuantityChange(-1);
                }}
                disabled={updating || quantity <= 0}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuantityChange(1);
                }}
                disabled={updating}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Badge
              variant={
                item.condition === 'new'
                  ? 'success'
                  : item.condition === 'working'
                  ? 'info'
                  : item.condition === 'needs_repair'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {item.condition.replace('_', ' ')}
            </Badge>
            {item.serial_number && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {item.serial_number}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
