import { Item, Category, Vendor, ItemImage, TrackingMode, ItemCondition } from './database';

// API Request types
export interface CreateItemRequest {
  name: string;
  description?: string;
  tracking_mode: TrackingMode;
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  serial_number?: string;
  asset_tag?: string;
  condition?: ItemCondition;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
  category_id?: string | null;
  vendor_id?: string | null;
  specifications?: Record<string, string>;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_url?: string;
  datasheet_url?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface CreateVendorRequest {
  name: string;
  website?: string;
  notes?: string;
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  id: string;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ItemsListResponse extends PaginatedResponse<Item> {}

export interface ItemDetailResponse extends Item {
  category: Category | null;
  vendor: Vendor | null;
  images: ItemImage[];
}

export interface StatsResponse {
  total_items: number;
  total_units: number;
  categories_used: number;
  unique_locations: number;
  low_stock_items: number;
  total_value: number;
}

// Query params
export interface ItemsQueryParams {
  category?: string;
  vendor?: string;
  location?: string;
  tracking_mode?: TrackingMode;
  low_stock?: boolean;
  q?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Error response
export interface ApiError {
  error: string;
  details?: unknown;
}
