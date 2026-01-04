import { getDb, type ItemWithRelations, type Category } from '../db.js';

export function getPartDetails(itemId: string): ItemWithRelations | null {
  const db = getDb();

  const item = db.prepare(`
    SELECT i.*, c.name as category_name, v.name as vendor_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN vendors v ON i.vendor_id = v.id
    WHERE i.id = ?
  `).get(itemId) as ItemWithRelations | undefined;

  return item || null;
}

export function getPartByName(name: string): ItemWithRelations | null {
  const db = getDb();

  // Try exact match first
  let item = db.prepare(`
    SELECT i.*, c.name as category_name, v.name as vendor_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN vendors v ON i.vendor_id = v.id
    WHERE LOWER(i.name) = LOWER(?)
  `).get(name) as ItemWithRelations | undefined;

  // Fall back to partial match
  if (!item) {
    item = db.prepare(`
      SELECT i.*, c.name as category_name, v.name as vendor_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE LOWER(i.name) LIKE LOWER(?)
      LIMIT 1
    `).get(`%${name}%`) as ItemWithRelations | undefined;
  }

  return item || null;
}

export interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  location: string | null;
  category_name: string | null;
}

export function getLowStockReport(): LowStockItem[] {
  const db = getDb();

  const items = db.prepare(`
    SELECT i.id, i.name, i.quantity, i.min_quantity, i.unit, i.location, c.name as category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.tracking_mode = 'quantity'
      AND i.min_quantity > 0
      AND i.quantity <= i.min_quantity
    ORDER BY (i.quantity * 1.0 / i.min_quantity) ASC, i.name
  `).all() as LowStockItem[];

  return items;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
}

export function listCategories(): CategoryWithCount[] {
  const db = getDb();

  const categories = db.prepare(`
    SELECT c.id, c.name, c.description, COUNT(i.id) as item_count
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all() as CategoryWithCount[];

  return categories;
}

export interface InventoryStats {
  total_items: number;
  total_quantity: number;
  low_stock_count: number;
  category_count: number;
  total_value: number;
}

export function getInventoryStats(): InventoryStats {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_items,
      COALESCE(SUM(quantity), 0) as total_quantity,
      (SELECT COUNT(*) FROM items WHERE tracking_mode = 'quantity' AND min_quantity > 0 AND quantity <= min_quantity) as low_stock_count,
      (SELECT COUNT(*) FROM categories) as category_count,
      COALESCE(SUM(purchase_price * quantity), 0) as total_value
    FROM items
  `).get() as InventoryStats;

  return stats;
}
