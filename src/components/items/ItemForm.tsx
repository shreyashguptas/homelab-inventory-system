'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ImageUploader } from '@/components/images/ImageUploader';
import { SpecificationsEditor } from './SpecificationsEditor';
import { TagsInput } from './TagsInput';
import type { ItemWithRelations, Category, Vendor, TrackingMode, ItemCondition } from '@/lib/types/database';

interface ItemFormProps {
  item?: ItemWithRelations;
  categories: Category[];
  vendors: Vendor[];
}

export function ItemForm({ item, categories, vendors }: ItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingMode, setTrackingMode] = useState<TrackingMode>(
    item?.tracking_mode || 'quantity'
  );
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    item?.specifications_parsed || {}
  );
  const [tags, setTags] = useState<string[]>(item?.tags_parsed || []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      tracking_mode: trackingMode,
      location: (formData.get('location') as string) || undefined,
      category_id: (formData.get('category_id') as string) || undefined,
      vendor_id: (formData.get('vendor_id') as string) || undefined,
      specifications,
      tags,
      notes: (formData.get('notes') as string) || undefined,
      purchase_url: (formData.get('purchase_url') as string) || undefined,
      datasheet_url: (formData.get('datasheet_url') as string) || undefined,
      quantity: trackingMode === 'quantity' ? parseInt(formData.get('quantity') as string) || 0 : undefined,
      min_quantity: trackingMode === 'quantity' ? parseInt(formData.get('min_quantity') as string) || 0 : undefined,
      unit: trackingMode === 'quantity' ? (formData.get('unit') as string) || 'pcs' : undefined,
      serial_number: trackingMode === 'individual' ? (formData.get('serial_number') as string) || undefined : undefined,
      asset_tag: trackingMode === 'individual' ? (formData.get('asset_tag') as string) || undefined : undefined,
      condition: trackingMode === 'individual' ? (formData.get('condition') as ItemCondition) || 'working' : undefined,
      purchase_date: trackingMode === 'individual' ? (formData.get('purchase_date') as string) || undefined : undefined,
      warranty_expiry: trackingMode === 'individual' ? (formData.get('warranty_expiry') as string) || undefined : undefined,
      purchase_price: (formData.get('purchase_price') as string) ? parseFloat(formData.get('purchase_price') as string) : undefined,
      purchase_currency: (formData.get('purchase_currency') as string) || 'USD',
    };

    try {
      const url = item ? `/api/items/${item.id}` : '/api/items';
      const method = item ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save item');
      }

      const savedItem = await res.json();
      router.push(`/items/${savedItem.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            name="name"
            label="Name"
            required
            defaultValue={item?.name}
            placeholder="e.g., Arduino Uno R3"
          />

          <Input
            name="description"
            label="Description"
            multiline
            rows={3}
            defaultValue={item?.description || ''}
            placeholder="Brief description of the item"
          />

          <Input
            name="location"
            label="Location"
            defaultValue={item?.location || ''}
            placeholder="e.g., Drawer 3, Shelf B"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              name="category_id"
              label="Category"
              defaultValue={item?.category_id || ''}
              options={[
                { value: '', label: 'Select category...' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              name="vendor_id"
              label="Vendor/Source"
              defaultValue={item?.vendor_id || ''}
              options={[
                { value: '', label: 'Select vendor...' },
                ...vendors.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tracking Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1">
              <input
                type="radio"
                name="tracking_mode_radio"
                value="quantity"
                checked={trackingMode === 'quantity'}
                onChange={() => setTrackingMode('quantity')}
                className="text-primary-600"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Quantity-based</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Track items by quantity (e.g., 50 resistors)
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1">
              <input
                type="radio"
                name="tracking_mode_radio"
                value="individual"
                checked={trackingMode === 'individual'}
                onChange={() => setTrackingMode('individual')}
                className="text-primary-600"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Individual</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Track as a unique item (e.g., specific Raspberry Pi)
                </div>
              </div>
            </label>
          </div>

          {trackingMode === 'quantity' ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                name="quantity"
                label="Quantity"
                type="number"
                min={0}
                defaultValue={item?.quantity || 0}
              />
              <Input
                name="min_quantity"
                label="Low Stock Alert"
                type="number"
                min={0}
                defaultValue={item?.min_quantity || 0}
                placeholder="0 = no alert"
              />
              <Input
                name="unit"
                label="Unit"
                defaultValue={item?.unit || 'pcs'}
                placeholder="pcs, meters, etc."
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  name="serial_number"
                  label="Serial Number"
                  defaultValue={item?.serial_number || ''}
                />
                <Input
                  name="asset_tag"
                  label="Asset Tag"
                  defaultValue={item?.asset_tag || ''}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Select
                  name="condition"
                  label="Condition"
                  defaultValue={item?.condition || 'working'}
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'working', label: 'Working' },
                    { value: 'needs_repair', label: 'Needs Repair' },
                    { value: 'broken', label: 'Broken' },
                    { value: 'retired', label: 'Retired' },
                  ]}
                />
                <Input
                  name="purchase_date"
                  label="Purchase Date"
                  type="date"
                  defaultValue={item?.purchase_date || ''}
                />
                <Input
                  name="warranty_expiry"
                  label="Warranty Expiry"
                  type="date"
                  defaultValue={item?.warranty_expiry || ''}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecificationsEditor value={specifications} onChange={setSpecifications} />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagsInput value={tags} onChange={setTags} />
        </CardContent>
      </Card>

      {/* Purchase Information */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              name="purchase_price"
              label="Purchase Price"
              type="number"
              step="0.01"
              min={0}
              defaultValue={item?.purchase_price || ''}
            />
            <Select
              name="purchase_currency"
              label="Currency"
              defaultValue={item?.purchase_currency || 'USD'}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'INR', label: 'INR' },
                { value: 'CAD', label: 'CAD' },
                { value: 'AUD', label: 'AUD' },
              ]}
            />
          </div>

          <Input
            name="purchase_url"
            label="Purchase URL"
            type="url"
            defaultValue={item?.purchase_url || ''}
            placeholder="https://..."
          />

          <Input
            name="datasheet_url"
            label="Datasheet URL"
            type="url"
            defaultValue={item?.datasheet_url || ''}
            placeholder="https://..."
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            name="notes"
            multiline
            rows={4}
            defaultValue={item?.notes || ''}
            placeholder="Additional notes about this item..."
          />
        </CardContent>
      </Card>

      {/* Images (only show for existing items) */}
      {item && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader itemId={item.id} existingImages={item.images} />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" loading={loading}>
          {item ? 'Update Item' : 'Create Item'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
