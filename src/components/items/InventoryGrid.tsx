'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemCard } from './ItemCard';
import { Button, Modal } from '@/components/ui';
import type { Item } from '@/lib/types/database';

interface InventoryGridProps {
  items: Item[];
}

export function InventoryGrid({ items }: InventoryGridProps) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/items/bulk?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`Deleted ${result.deletedCount} items`);
        setSelectedIds(new Set());
        setSelectionMode(false);
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        console.error('Failed to delete items');
      }
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Selection Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!selectionMode ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectionMode(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Select Items
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelSelection}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Selection count and actions */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedIds.size} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            selectable={selectionMode}
            selected={selectedIds.has(item.id)}
            onSelectionChange={handleSelectionChange}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Items"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              loading={deleting}
            >
              Delete {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
