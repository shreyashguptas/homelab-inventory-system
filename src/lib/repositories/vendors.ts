import { getDb } from '../db';
import { generateId } from '../utils/uuid';
import type { Vendor, VendorWithCount } from '../types/database';
import type { CreateVendorRequest } from '../types/api';

export const vendorsRepository = {
  findAll(): VendorWithCount[] {
    const db = getDb();
    return db.prepare(`
      SELECT v.*, COUNT(i.id) as item_count
      FROM vendors v
      LEFT JOIN items i ON i.vendor_id = v.id
      GROUP BY v.id
      ORDER BY v.name
    `).all() as VendorWithCount[];
  },

  findById(id: string): VendorWithCount | null {
    const db = getDb();
    return db.prepare(`
      SELECT v.*, COUNT(i.id) as item_count
      FROM vendors v
      LEFT JOIN items i ON i.vendor_id = v.id
      WHERE v.id = ?
      GROUP BY v.id
    `).get(id) as VendorWithCount | null;
  },

  findByName(name: string): Vendor | null {
    const db = getDb();
    return db.prepare('SELECT * FROM vendors WHERE name = ?').get(name) as Vendor | null;
  },

  create(data: CreateVendorRequest): Vendor {
    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO vendors (id, name, website, notes)
      VALUES (?, ?, ?, ?)
    `).run(id, data.name, data.website || null, data.notes || null);

    return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as Vendor;
  },

  update(id: string, data: Partial<CreateVendorRequest>): Vendor | null {
    const db = getDb();

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.website !== undefined) {
      updates.push('website = ?');
      values.push(data.website || null);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes || null);
    }

    if (updates.length === 0) return null;

    values.push(id);
    db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as Vendor | null;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
