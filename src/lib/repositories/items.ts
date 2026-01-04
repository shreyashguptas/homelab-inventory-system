import { getDb } from '../db';
import { generateId } from '../utils/uuid';
import type { Item, ItemWithRelations, ItemImage, TrackingMode } from '../types/database';
import type { CreateItemRequest, UpdateItemRequest, ItemsQueryParams } from '../types/api';

export interface ItemsListResult {
  items: Item[];
  total: number;
}

export const itemsRepository = {
  findAll(params: ItemsQueryParams = {}): ItemsListResult {
    const db = getDb();
    const {
      category,
      vendor,
      location,
      tracking_mode,
      low_stock,
      q,
      page = 1,
      limit = 50,
      sort_by = 'updated_at',
      sort_order = 'desc',
    } = params;

    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];

    if (category) {
      conditions.push('i.category_id = ?');
      queryParams.push(category);
    }

    if (vendor) {
      conditions.push('i.vendor_id = ?');
      queryParams.push(vendor);
    }

    if (location) {
      conditions.push('i.location LIKE ?');
      queryParams.push(`%${location}%`);
    }

    if (tracking_mode) {
      conditions.push('i.tracking_mode = ?');
      queryParams.push(tracking_mode);
    }

    if (low_stock) {
      conditions.push('i.tracking_mode = ? AND i.quantity <= i.min_quantity AND i.min_quantity > 0');
      queryParams.push('quantity');
    }

    if (q) {
      conditions.push('i.rowid IN (SELECT rowid FROM items_fts WHERE items_fts MATCH ?)');
      queryParams.push(q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'quantity', 'location'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'updated_at';
    const safeSortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM items i ${whereClause}`;
    const countResult = db.prepare(countSql).get(...queryParams) as { total: number };

    // Items query with pagination
    const offset = (page - 1) * limit;
    const itemsSql = `
      SELECT i.*
      FROM items i
      ${whereClause}
      ORDER BY i.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const items = db.prepare(itemsSql).all(...queryParams, limit, offset) as Item[];

    return {
      items,
      total: countResult.total,
    };
  },

  findById(id: string): ItemWithRelations | null {
    const db = getDb();

    const item = db.prepare(`
      SELECT i.*,
        c.id as cat_id, c.name as cat_name, c.description as cat_description,
        c.color as cat_color, c.icon as cat_icon, c.created_at as cat_created_at,
        c.updated_at as cat_updated_at,
        v.id as ven_id, v.name as ven_name, v.website as ven_website,
        v.notes as ven_notes, v.created_at as ven_created_at, v.updated_at as ven_updated_at
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE i.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!item) return null;

    // Get images
    const images = db.prepare(`
      SELECT * FROM images WHERE item_id = ? ORDER BY is_primary DESC, created_at ASC
    `).all(id) as ItemImage[];

    // Parse JSON fields and construct response
    return {
      id: item.id as string,
      name: item.name as string,
      description: item.description as string | null,
      tracking_mode: item.tracking_mode as TrackingMode,
      quantity: item.quantity as number,
      min_quantity: item.min_quantity as number,
      unit: item.unit as string,
      serial_number: item.serial_number as string | null,
      asset_tag: item.asset_tag as string | null,
      condition: item.condition as Item['condition'],
      purchase_date: item.purchase_date as string | null,
      warranty_expiry: item.warranty_expiry as string | null,
      location: item.location as string | null,
      category_id: item.category_id as string | null,
      vendor_id: item.vendor_id as string | null,
      specifications: item.specifications as string,
      purchase_price: item.purchase_price as number | null,
      purchase_currency: item.purchase_currency as string,
      purchase_url: item.purchase_url as string | null,
      datasheet_url: item.datasheet_url as string | null,
      notes: item.notes as string | null,
      tags: item.tags as string,
      created_at: item.created_at as string,
      updated_at: item.updated_at as string,
      category: item.cat_id
        ? {
            id: item.cat_id as string,
            name: item.cat_name as string,
            description: item.cat_description as string | null,
            color: item.cat_color as string,
            icon: item.cat_icon as string | null,
            created_at: item.cat_created_at as string,
            updated_at: item.cat_updated_at as string,
          }
        : null,
      vendor: item.ven_id
        ? {
            id: item.ven_id as string,
            name: item.ven_name as string,
            website: item.ven_website as string | null,
            notes: item.ven_notes as string | null,
            created_at: item.ven_created_at as string,
            updated_at: item.ven_updated_at as string,
          }
        : null,
      images,
      specifications_parsed: JSON.parse((item.specifications as string) || '{}'),
      tags_parsed: JSON.parse((item.tags as string) || '[]'),
    };
  },

  findAllForExport(): ItemWithRelations[] {
    const db = getDb();

    const items = db.prepare(`
      SELECT i.*,
        c.id as cat_id, c.name as cat_name, c.description as cat_description,
        c.color as cat_color, c.icon as cat_icon, c.created_at as cat_created_at,
        c.updated_at as cat_updated_at,
        v.id as ven_id, v.name as ven_name, v.website as ven_website,
        v.notes as ven_notes, v.created_at as ven_created_at, v.updated_at as ven_updated_at
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      ORDER BY i.name
    `).all() as Record<string, unknown>[];

    return items.map((item) => ({
      id: item.id as string,
      name: item.name as string,
      description: item.description as string | null,
      tracking_mode: item.tracking_mode as TrackingMode,
      quantity: item.quantity as number,
      min_quantity: item.min_quantity as number,
      unit: item.unit as string,
      serial_number: item.serial_number as string | null,
      asset_tag: item.asset_tag as string | null,
      condition: item.condition as Item['condition'],
      purchase_date: item.purchase_date as string | null,
      warranty_expiry: item.warranty_expiry as string | null,
      location: item.location as string | null,
      category_id: item.category_id as string | null,
      vendor_id: item.vendor_id as string | null,
      specifications: item.specifications as string,
      purchase_price: item.purchase_price as number | null,
      purchase_currency: item.purchase_currency as string,
      purchase_url: item.purchase_url as string | null,
      datasheet_url: item.datasheet_url as string | null,
      notes: item.notes as string | null,
      tags: item.tags as string,
      created_at: item.created_at as string,
      updated_at: item.updated_at as string,
      category: item.cat_id
        ? {
            id: item.cat_id as string,
            name: item.cat_name as string,
            description: item.cat_description as string | null,
            color: item.cat_color as string,
            icon: item.cat_icon as string | null,
            created_at: item.cat_created_at as string,
            updated_at: item.cat_updated_at as string,
          }
        : null,
      vendor: item.ven_id
        ? {
            id: item.ven_id as string,
            name: item.ven_name as string,
            website: item.ven_website as string | null,
            notes: item.ven_notes as string | null,
            created_at: item.ven_created_at as string,
            updated_at: item.ven_updated_at as string,
          }
        : null,
      images: [],
      specifications_parsed: JSON.parse((item.specifications as string) || '{}'),
      tags_parsed: JSON.parse((item.tags as string) || '[]'),
    }));
  },

  create(data: CreateItemRequest): Item {
    const db = getDb();
    const id = generateId();

    const stmt = db.prepare(`
      INSERT INTO items (
        id, name, description, tracking_mode,
        quantity, min_quantity, unit,
        serial_number, asset_tag, condition, purchase_date, warranty_expiry,
        location, category_id, vendor_id, specifications,
        purchase_price, purchase_currency, purchase_url, datasheet_url,
        notes, tags
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.tracking_mode,
      data.quantity || 0,
      data.min_quantity || 0,
      data.unit || 'pcs',
      data.serial_number || null,
      data.asset_tag || null,
      data.condition || 'working',
      data.purchase_date || null,
      data.warranty_expiry || null,
      data.location || null,
      data.category_id || null,
      data.vendor_id || null,
      JSON.stringify(data.specifications || {}),
      data.purchase_price || null,
      data.purchase_currency || 'USD',
      data.purchase_url || null,
      data.datasheet_url || null,
      data.notes || null,
      JSON.stringify(data.tags || [])
    );

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item;
  },

  update(id: string, data: Partial<CreateItemRequest>): Item | null {
    const db = getDb();

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description || null);
    }
    if (data.tracking_mode !== undefined) {
      updates.push('tracking_mode = ?');
      values.push(data.tracking_mode);
    }
    if (data.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(data.quantity);
    }
    if (data.min_quantity !== undefined) {
      updates.push('min_quantity = ?');
      values.push(data.min_quantity);
    }
    if (data.unit !== undefined) {
      updates.push('unit = ?');
      values.push(data.unit);
    }
    if (data.serial_number !== undefined) {
      updates.push('serial_number = ?');
      values.push(data.serial_number || null);
    }
    if (data.asset_tag !== undefined) {
      updates.push('asset_tag = ?');
      values.push(data.asset_tag || null);
    }
    if (data.condition !== undefined) {
      updates.push('condition = ?');
      values.push(data.condition);
    }
    if (data.purchase_date !== undefined) {
      updates.push('purchase_date = ?');
      values.push(data.purchase_date || null);
    }
    if (data.warranty_expiry !== undefined) {
      updates.push('warranty_expiry = ?');
      values.push(data.warranty_expiry || null);
    }
    if (data.location !== undefined) {
      updates.push('location = ?');
      values.push(data.location || null);
    }
    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(data.category_id || null);
    }
    if (data.vendor_id !== undefined) {
      updates.push('vendor_id = ?');
      values.push(data.vendor_id || null);
    }
    if (data.specifications !== undefined) {
      updates.push('specifications = ?');
      values.push(JSON.stringify(data.specifications));
    }
    if (data.purchase_price !== undefined) {
      updates.push('purchase_price = ?');
      values.push(data.purchase_price || null);
    }
    if (data.purchase_currency !== undefined) {
      updates.push('purchase_currency = ?');
      values.push(data.purchase_currency);
    }
    if (data.purchase_url !== undefined) {
      updates.push('purchase_url = ?');
      values.push(data.purchase_url || null);
    }
    if (data.datasheet_url !== undefined) {
      updates.push('datasheet_url = ?');
      values.push(data.datasheet_url || null);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes || null);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE items SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | null;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return result.changes > 0;
  },

  adjustQuantity(id: string, delta: number): Item | null {
    const db = getDb();
    db.prepare(`
      UPDATE items
      SET quantity = MAX(0, quantity + ?)
      WHERE id = ? AND tracking_mode = 'quantity'
    `).run(delta, id);

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | null;
  },

  search(query: string, limit = 20): Item[] {
    const db = getDb();
    return db.prepare(`
      SELECT i.*
      FROM items i
      WHERE i.rowid IN (SELECT rowid FROM items_fts WHERE items_fts MATCH ?)
      LIMIT ?
    `).all(query, limit) as Item[];
  },

  getLowStock(): Item[] {
    const db = getDb();
    return db.prepare(`
      SELECT *
      FROM items
      WHERE tracking_mode = 'quantity'
        AND quantity <= min_quantity
        AND min_quantity > 0
      ORDER BY (min_quantity - quantity) DESC
    `).all() as Item[];
  },

  duplicate(id: string): Item | null {
    const db = getDb();
    const original = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | null;

    if (!original) return null;

    const newId = generateId();
    const newName = `${original.name} (Copy)`;

    db.prepare(`
      INSERT INTO items (
        id, name, description, tracking_mode,
        quantity, min_quantity, unit,
        serial_number, asset_tag, condition, purchase_date, warranty_expiry,
        location, category_id, vendor_id, specifications,
        purchase_price, purchase_currency, purchase_url, datasheet_url,
        notes, tags
      )
      SELECT
        ?, ?, description, tracking_mode,
        quantity, min_quantity, unit,
        NULL, NULL, condition, purchase_date, warranty_expiry,
        location, category_id, vendor_id, specifications,
        purchase_price, purchase_currency, purchase_url, datasheet_url,
        notes, tags
      FROM items WHERE id = ?
    `).run(newId, newName, id);

    return db.prepare('SELECT * FROM items WHERE id = ?').get(newId) as Item;
  },

  getUniqueLocations(): string[] {
    const db = getDb();
    const results = db.prepare(`
      SELECT DISTINCT location
      FROM items
      WHERE location IS NOT NULL AND location != ''
      ORDER BY location
    `).all() as { location: string }[];

    return results.map((r) => r.location);
  },
};
