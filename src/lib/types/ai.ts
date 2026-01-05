import type { TrackingMode, ItemCondition } from './database';

export interface TempImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

export interface ExtractedFormData {
  name?: string;
  description?: string;
  tracking_mode?: TrackingMode;

  // Quantity tracking
  quantity?: number;
  min_quantity?: number;
  unit?: string;

  // Individual tracking
  serial_number?: string;
  asset_tag?: string;
  condition?: ItemCondition;
  purchase_date?: string;
  warranty_expiry?: string;

  // Location and relationships
  location?: string;
  category_id?: string;
  category_name_suggestion?: string;
  vendor_id?: string;
  vendor_name_suggestion?: string;

  // Specifications and tags
  specifications?: Record<string, string>;
  tags?: string[];

  // Purchase info
  purchase_price?: number;
  purchase_currency?: string;
  purchase_url?: string;
  datasheet_url?: string;

  // Notes
  notes?: string;
}

export interface TranscriptionResponse {
  text: string;
}

export interface ExtractionRequest {
  text: string;
  images: string[];
  categories: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}

export interface AIContext {
  categories: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}
