export type TrackingMode = 'quantity' | 'individual';
export type ItemCondition = 'new' | 'working' | 'needs_repair' | 'broken' | 'retired';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  tracking_mode: TrackingMode;

  // Quantity tracking
  quantity: number;
  min_quantity: number;
  unit: string;

  // Individual tracking
  serial_number: string | null;
  asset_tag: string | null;
  condition: ItemCondition;
  purchase_date: string | null;
  warranty_expiry: string | null;

  // Common
  location: string | null;
  category_id: string | null;
  vendor_id: string | null;
  specifications: string; // JSON string

  // Purchase info
  purchase_price: number | null;
  purchase_currency: string;
  purchase_url: string | null;
  datasheet_url: string | null;

  // Metadata
  notes: string | null;
  tags: string; // JSON array string
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  filename: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  is_primary: number;
  created_at: string;
}

// Parsed/hydrated versions for application use
export interface ItemWithRelations extends Item {
  category: Category | null;
  vendor: Vendor | null;
  images: ItemImage[];
  specifications_parsed: Record<string, string>;
  tags_parsed: string[];
}

// Item with primary image for list views
export interface ItemWithImage extends Item {
  primary_image: ItemImage | null;
}

export interface CategoryWithCount extends Category {
  item_count: number;
}

export interface VendorWithCount extends Vendor {
  item_count: number;
}
