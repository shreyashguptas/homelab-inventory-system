'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Combobox } from '@/components/ui';
import { usePlatform, getModifierKeyDisplay, getShiftKeyDisplay } from '@/hooks/useKeyboardShortcuts';
import { Kbd } from '@/components/keyboard/KeyboardShortcutsHelp';
import type { ComboboxOption } from '@/components/ui';
import { ImageUploader } from '@/components/images/ImageUploader';
import { TempImageUploader } from '@/components/images/TempImageUploader';
import { VoiceAssistModal } from '@/components/voice/VoiceAssistModal';
import { SpecificationsEditor } from './SpecificationsEditor';
import { TagsInput } from './TagsInput';
import { UNITS } from '@/lib/constants/units';
import type { ItemWithRelations, Category, Vendor, TrackingMode, ItemCondition } from '@/lib/types/database';
import type { TempImage, ExtractedFormData } from '@/lib/types/ai';

interface ItemFormProps {
  item?: ItemWithRelations;
  categories: Category[];
  vendors: Vendor[];
}

export function ItemForm({ item, categories: initialCategories, vendors: initialVendors }: ItemFormProps) {
  const router = useRouter();
  const { platform, hasKeyboard, isClient } = usePlatform();
  const modKey = getModifierKeyDisplay(platform);
  const shiftKey = getShiftKeyDisplay(platform);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingMode, setTrackingMode] = useState<TrackingMode>(
    item?.tracking_mode || 'quantity'
  );
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    item?.specifications_parsed || {}
  );
  const [tags, setTags] = useState<string[]>(item?.tags_parsed || []);

  // State for dynamically created categories/vendors
  const [categories, setCategories] = useState(initialCategories);
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedCategoryId, setSelectedCategoryId] = useState(item?.category_id || '');
  const [selectedVendorId, setSelectedVendorId] = useState(item?.vendor_id || '');

  // State for validated number fields
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '0');
  const [minQuantity, setMinQuantity] = useState(item?.min_quantity?.toString() || '0');
  const [purchasePrice, setPurchasePrice] = useState(item?.purchase_price?.toString() || '');

  // Price entry mode: 'per_unit' or 'total' (only relevant for quantity tracking mode)
  const [priceMode, setPriceMode] = useState<'per_unit' | 'total'>('per_unit');
  const [totalPrice, setTotalPrice] = useState('');

  // Voice assist state
  const [showVoiceAssist, setShowVoiceAssist] = useState(false);
  const [pendingImages, setPendingImages] = useState<TempImage[]>([]);

  // Form refs for setting values programmatically
  const formRef = useRef<HTMLFormElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + Shift + Enter to submit form
  useEffect(() => {
    if (!hasKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;

      // Cmd/Ctrl + Shift + Enter - Submit form
      if (meta && shift && event.key === 'Enter') {
        event.preventDefault();
        if (formRef.current && !loading) {
          formRef.current.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasKeyboard, loading]);

  // Validate and sanitize numeric input (allows decimals)
  const handleNumericInput = (
    value: string,
    setter: (val: string) => void,
    allowDecimals = true
  ) => {
    // Remove any non-numeric characters except decimal point
    let sanitized = value.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, '');

    // Ensure only one decimal point
    if (allowDecimals) {
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setter(sanitized);
  };

  // Calculate per-unit price from total price and quantity
  const calculatePerUnitPrice = (total: string, qty: string): string => {
    const totalNum = parseFloat(total);
    const qtyNum = parseFloat(qty);
    if (!isNaN(totalNum) && !isNaN(qtyNum) && qtyNum > 0) {
      return (totalNum / qtyNum).toFixed(2);
    }
    return '';
  };

  // Calculate total price from per-unit price and quantity
  const calculateTotalPrice = (perUnit: string, qty: string): string => {
    const perUnitNum = parseFloat(perUnit);
    const qtyNum = parseFloat(qty);
    if (!isNaN(perUnitNum) && !isNaN(qtyNum) && qtyNum > 0) {
      return (perUnitNum * qtyNum).toFixed(2);
    }
    return '';
  };

  // Get the effective per-unit price for form submission
  const getEffectivePerUnitPrice = (): string => {
    if (trackingMode === 'individual') {
      return purchasePrice;
    }
    if (priceMode === 'per_unit') {
      return purchasePrice;
    }
    // Calculate from total
    return calculatePerUnitPrice(totalPrice, quantity);
  };

  // Create new category
  const handleCreateCategory = async (name: string): Promise<ComboboxOption | null> => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create category');
      }

      const category = await res.json();
      setCategories((prev) => [...prev, category]);
      return { value: category.id, label: category.name };
    } catch (err) {
      console.error('Failed to create category:', err);
      return null;
    }
  };

  // Create new vendor
  const handleCreateVendor = async (name: string): Promise<ComboboxOption | null> => {
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create vendor');
      }

      const vendor = await res.json();
      setVendors((prev) => [...prev, vendor]);
      return { value: vendor.id, label: vendor.name };
    } catch (err) {
      console.error('Failed to create vendor:', err);
      return null;
    }
  };

  // Apply AI-extracted data to form fields
  const applyAIData = async (data: ExtractedFormData, images: TempImage[]) => {
    // Set pending images
    setPendingImages(images);

    // Set tracking mode first (affects which fields are visible)
    if (data.tracking_mode) {
      setTrackingMode(data.tracking_mode);
    }

    // Set state-controlled fields
    if (data.specifications) {
      setSpecifications(data.specifications);
    }
    if (data.tags) {
      setTags(data.tags);
    }
    if (data.quantity !== undefined) {
      setQuantity(data.quantity.toString());
    }
    if (data.min_quantity !== undefined) {
      setMinQuantity(data.min_quantity.toString());
    }
    if (data.purchase_price !== undefined) {
      setPurchasePrice(data.purchase_price.toString());
    }

    // Handle category - either use existing ID or create new
    if (data.category_id) {
      setSelectedCategoryId(data.category_id);
    } else if (data.category_name_suggestion) {
      const newCategory = await handleCreateCategory(data.category_name_suggestion);
      if (newCategory) {
        setSelectedCategoryId(newCategory.value);
      }
    }

    // Handle vendor - either use existing ID or create new
    if (data.vendor_id) {
      setSelectedVendorId(data.vendor_id);
    } else if (data.vendor_name_suggestion) {
      const newVendor = await handleCreateVendor(data.vendor_name_suggestion);
      if (newVendor) {
        setSelectedVendorId(newVendor.value);
      }
    }

    // Set form input values directly using the form ref
    if (formRef.current) {
      const setInputValue = (name: string, value: string | undefined) => {
        if (value === undefined) return;
        const input = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (input) {
          input.value = value;
        }
      };

      setInputValue('name', data.name);
      setInputValue('description', data.description);
      setInputValue('location', data.location);
      setInputValue('notes', data.notes);
      setInputValue('purchase_url', data.purchase_url);
      setInputValue('datasheet_url', data.datasheet_url);
      setInputValue('unit', data.unit);
      setInputValue('serial_number', data.serial_number);
      setInputValue('asset_tag', data.asset_tag);
      setInputValue('condition', data.condition);
      setInputValue('purchase_date', data.purchase_date);
      setInputValue('warranty_expiry', data.warranty_expiry);
      setInputValue('purchase_currency', data.purchase_currency);
    }

    // Close the modal
    setShowVoiceAssist(false);
  };

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
      category_id: selectedCategoryId || undefined,
      vendor_id: selectedVendorId || undefined,
      specifications,
      tags,
      notes: (formData.get('notes') as string) || undefined,
      purchase_url: (formData.get('purchase_url') as string) || undefined,
      datasheet_url: (formData.get('datasheet_url') as string) || undefined,
      quantity: trackingMode === 'quantity' ? parseFloat(quantity) || 0 : undefined,
      min_quantity: trackingMode === 'quantity' ? parseFloat(minQuantity) || 0 : undefined,
      unit: trackingMode === 'quantity' ? (formData.get('unit') as string) || 'pcs' : undefined,
      serial_number: trackingMode === 'individual' ? (formData.get('serial_number') as string) || undefined : undefined,
      asset_tag: trackingMode === 'individual' ? (formData.get('asset_tag') as string) || undefined : undefined,
      condition: trackingMode === 'individual' ? (formData.get('condition') as ItemCondition) || 'working' : undefined,
      purchase_date: trackingMode === 'individual' ? (formData.get('purchase_date') as string) || undefined : undefined,
      warranty_expiry: trackingMode === 'individual' ? (formData.get('warranty_expiry') as string) || undefined : undefined,
      purchase_price: getEffectivePerUnitPrice() ? parseFloat(getEffectivePerUnitPrice()) : undefined,
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

      // Upload pending images if any (for new items)
      if (!item && pendingImages.length > 0) {
        for (let i = 0; i < pendingImages.length; i++) {
          const img = pendingImages[i];
          const imageForm = new FormData();
          imageForm.append('file', img.file);
          imageForm.append('item_id', savedItem.id);
          if (img.isPrimary) {
            imageForm.append('is_primary', 'true');
          }

          try {
            await fetch('/api/images', {
              method: 'POST',
              body: imageForm,
            });
          } catch (imgErr) {
            console.error('Failed to upload image:', imgErr);
          }
        }

        // Cleanup blob URLs
        pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setPendingImages([]);
      }

      router.push(`/items/${savedItem.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VoiceAssistModal
        isOpen={showVoiceAssist}
        onClose={() => setShowVoiceAssist(false)}
        onComplete={applyAIData}
        categories={categories}
        vendors={vendors}
      />

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Voice Assist Button - only show for new items */}
        {!item && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => setShowVoiceAssist(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              Add using microphone
            </Button>
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
            <Combobox
              name="category_id"
              label="Category"
              placeholder="Search or create category..."
              value={selectedCategoryId}
              onChange={(value) => setSelectedCategoryId(value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              onCreateNew={handleCreateCategory}
              createLabel="Create category"
            />

            <Combobox
              name="vendor_id"
              label="Vendor/Source"
              placeholder="Search or create vendor..."
              value={selectedVendorId}
              onChange={(value) => setSelectedVendorId(value)}
              options={vendors.map((v) => ({ value: v.id, label: v.name }))}
              onCreateNew={handleCreateVendor}
              createLabel="Create vendor"
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
            <div className="space-y-4">
              {/* Quantity fields */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => handleNumericInput(e.target.value, setQuantity)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                               focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={minQuantity}
                    onChange={(e) => handleNumericInput(e.target.value, setMinQuantity)}
                    placeholder="0 = no alert"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                               focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <Select
                  name="unit"
                  label="Unit"
                  defaultValue={item?.unit || 'pcs'}
                  options={UNITS.map((u) => ({ value: u.value, label: u.label }))}
                />
              </div>

              {/* Purchase Price Section for Quantity Mode */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Purchase Price:
                  </span>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="price_mode"
                        checked={priceMode === 'per_unit'}
                        onChange={() => setPriceMode('per_unit')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Per unit</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="price_mode"
                        checked={priceMode === 'total'}
                        onChange={() => setPriceMode('total')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total price</span>
                    </label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {priceMode === 'per_unit' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price per Unit
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={purchasePrice}
                          onChange={(e) => handleNumericInput(e.target.value, setPurchasePrice)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900
                                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                                     focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        />
                      </div>
                      {purchasePrice && parseFloat(quantity) > 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Total: ${calculateTotalPrice(purchasePrice, quantity)} for {quantity} units
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={totalPrice}
                          onChange={(e) => handleNumericInput(e.target.value, setTotalPrice)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900
                                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                                     focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        />
                      </div>
                      {totalPrice && parseFloat(quantity) > 0 && (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          = ${calculatePerUnitPrice(totalPrice, quantity)} per unit
                        </p>
                      )}
                    </div>
                  )}
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
              </div>
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

      {/* Purchase Information - For individual mode, shows price/currency. For both modes, shows URLs */}
      <Card>
        <CardHeader>
          <CardTitle>{trackingMode === 'individual' ? 'Purchase Information' : 'Links'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price and currency only for individual mode (quantity mode has these in Tracking Mode section) */}
          {trackingMode === 'individual' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={purchasePrice}
                    onChange={(e) => handleNumericInput(e.target.value, setPurchasePrice)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
                               focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
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
          )}

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

      {/* Images for existing items */}
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

      {/* Pending Images for new items (from voice assist) */}
      {!item && pendingImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images ({pendingImages.length}/3)</CardTitle>
          </CardHeader>
          <CardContent>
            <TempImageUploader
              images={pendingImages}
              onImagesChange={setPendingImages}
              maxImages={3}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              These images will be uploaded when you create the item.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-4">
          <Button type="submit" loading={loading}>
            {item ? 'Update Item' : 'Create Item'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        {isClient && hasKeyboard && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>or press</span>
            <Kbd size="sm">{modKey}</Kbd>
            <Kbd size="sm">{shiftKey}</Kbd>
            <Kbd size="sm">↵</Kbd>
          </div>
        )}
      </div>
      </form>
    </>
  );
}
