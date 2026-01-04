import { z } from 'zod';

export const TrackingModeSchema = z.enum(['quantity', 'individual']);
export const ItemConditionSchema = z.enum(['new', 'working', 'needs_repair', 'broken', 'retired']);

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  tracking_mode: TrackingModeSchema,
  quantity: z.number().int().min(0).optional(),
  min_quantity: z.number().int().min(0).optional(),
  unit: z.string().max(50).optional(),
  serial_number: z.string().max(255).optional(),
  asset_tag: z.string().max(255).optional(),
  condition: ItemConditionSchema.optional(),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  location: z.string().max(255).optional(),
  category_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  specifications: z.record(z.string()).optional(),
  purchase_price: z.number().min(0).optional(),
  purchase_currency: z.string().max(3).optional(),
  purchase_url: z.string().url().max(500).optional().or(z.literal('')),
  datasheet_url: z.string().url().max(500).optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
  icon: z.string().max(50).optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  website: z.string().url().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

export const QuantityAdjustSchema = z.object({
  delta: z.number().int(),
});

// Helper to parse and validate
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
