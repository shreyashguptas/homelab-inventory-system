import { getDb } from '../db';
import { generateId } from '../utils/uuid';
import type { Category, CategoryWithCount } from '../types/database';
import type { CreateCategoryRequest } from '../types/api';

export const categoriesRepository = {
  findAll(): CategoryWithCount[] {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, COUNT(i.id) as item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `).all() as CategoryWithCount[];
  },

  findById(id: string): CategoryWithCount | null {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, COUNT(i.id) as item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id) as CategoryWithCount | null;
  },

  findByName(name: string): Category | null {
    const db = getDb();
    return db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as Category | null;
  },

  create(data: CreateCategoryRequest): Category {
    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO categories (id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || null, data.color || '#6b7280', data.icon || null);

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
  },

  update(id: string, data: Partial<CreateCategoryRequest>): Category | null {
    const db = getDb();

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description || null);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon || null);
    }

    if (updates.length === 0) return null;

    values.push(id);
    db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | null;
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  },

  seedDefaults(categories: { name: string; description: string; color: string; icon: string }[]): void {
    const db = getDb();

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const cat of categories) {
        insertStmt.run(generateId(), cat.name, cat.description, cat.color, cat.icon);
      }
    });

    transaction();
  },
};
