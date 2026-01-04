import { getDb } from '../db';
import type { ItemImage } from '../types/database';

export interface CreateImageData {
  id: string;
  item_id: string;
  filename: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  is_primary: number;
}

export const imagesRepository = {
  findByItemId(itemId: string): ItemImage[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM images
      WHERE item_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `).all(itemId) as ItemImage[];
  },

  findById(id: string): ItemImage | null {
    const db = getDb();
    return db.prepare('SELECT * FROM images WHERE id = ?').get(id) as ItemImage | null;
  },

  create(data: CreateImageData): ItemImage {
    const db = getDb();

    db.prepare(`
      INSERT INTO images (id, item_id, filename, original_filename, mime_type, size_bytes, width, height, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.item_id,
      data.filename,
      data.original_filename,
      data.mime_type,
      data.size_bytes,
      data.width,
      data.height,
      data.is_primary
    );

    return db.prepare('SELECT * FROM images WHERE id = ?').get(data.id) as ItemImage;
  },

  delete(id: string): ItemImage | null {
    const db = getDb();
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(id) as ItemImage | null;

    if (image) {
      db.prepare('DELETE FROM images WHERE id = ?').run(id);
    }

    return image;
  },

  setPrimary(id: string, itemId: string): void {
    const db = getDb();

    const transaction = db.transaction(() => {
      // Unset all primary for this item
      db.prepare('UPDATE images SET is_primary = 0 WHERE item_id = ?').run(itemId);
      // Set the new primary
      db.prepare('UPDATE images SET is_primary = 1 WHERE id = ?').run(id);
    });

    transaction();
  },

  unsetPrimary(itemId: string): void {
    const db = getDb();
    db.prepare('UPDATE images SET is_primary = 0 WHERE item_id = ?').run(itemId);
  },

  getImageCount(itemId: string): number {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM images WHERE item_id = ?').get(itemId) as {
      count: number;
    };
    return result.count;
  },
};
