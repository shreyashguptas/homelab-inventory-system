import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/inventory.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  tracking_mode: 'quantity' | 'individual';
  quantity: number;
  min_quantity: number;
  unit: string;
  serial_number: string | null;
  asset_tag: string | null;
  condition: string | null;
  location: string | null;
  category_id: string | null;
  vendor_id: string | null;
  specifications: string | null;
  tags: string | null;
  purchase_price: number | null;
  purchase_currency: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  purchase_url: string | null;
  datasheet_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export interface ItemWithRelations extends Item {
  category_name: string | null;
  vendor_name: string | null;
}
