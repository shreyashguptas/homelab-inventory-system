'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import type { Vendor } from '@/lib/types/database';

interface VendorFormProps {
  vendor?: Vendor;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function VendorForm({ vendor, isOpen, onClose, onSave }: VendorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      website: (formData.get('website') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    try {
      const url = vendor ? `/api/vendors/${vendor.id}` : '/api/vendors';
      const method = vendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save vendor');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendor ? 'Edit Vendor' : 'Add Vendor'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          name="name"
          label="Name"
          required
          defaultValue={vendor?.name}
          placeholder="e.g., Adafruit, DigiKey"
        />

        <Input
          name="website"
          label="Website"
          type="url"
          defaultValue={vendor?.website || ''}
          placeholder="https://..."
        />

        <Input
          name="notes"
          label="Notes"
          multiline
          rows={3}
          defaultValue={vendor?.notes || ''}
          placeholder="Notes about this vendor..."
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {vendor ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
