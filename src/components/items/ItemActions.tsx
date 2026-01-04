'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Modal } from '@/components/ui';
import type { ItemWithRelations } from '@/lib/types/database';

interface ItemActionsProps {
  item: ItemWithRelations;
}

export function ItemActions({ item }: ItemActionsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/items');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      // Create a copy of the item
      const newItem = {
        name: `${item.name} (Copy)`,
        description: item.description,
        tracking_mode: item.tracking_mode,
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        unit: item.unit,
        condition: item.condition,
        location: item.location,
        category_id: item.category_id,
        vendor_id: item.vendor_id,
        specifications: item.specifications_parsed,
        purchase_price: item.purchase_price,
        purchase_currency: item.purchase_currency,
        purchase_url: item.purchase_url,
        datasheet_url: item.datasheet_url,
        notes: item.notes,
        tags: item.tags_parsed,
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/items/${created.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to duplicate item:', error);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link href={`/items/${item.id}/edit`}>
          <Button variant="secondary">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Button>
        </Link>

        <Button variant="secondary" onClick={handleDuplicate} loading={duplicating}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Duplicate
        </Button>

        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Item"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
