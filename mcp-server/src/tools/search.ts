import { getDb, type ItemWithRelations } from '../db.js';

export interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  tags?: string[];
  limit?: number;
}

export function searchInventory(params: SearchParams): ItemWithRelations[] {
  const db = getDb();
  const { query, category, location, tags, limit = 50 } = params;

  // If we have a full-text query, use FTS
  if (query && query.trim()) {
    const ftsResults = db.prepare(`
      SELECT i.*, c.name as category_name, v.name as vendor_name
      FROM items_fts fts
      JOIN items i ON fts.rowid = i.rowid
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE items_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(query.trim(), limit) as ItemWithRelations[];

    return filterResults(ftsResults, { category, location, tags });
  }

  // Otherwise, build a regular query
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (category) {
    conditions.push('c.name = ?');
    values.push(category);
  }

  if (location) {
    conditions.push('i.location LIKE ?');
    values.push(`%${location}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const items = db.prepare(`
    SELECT i.*, c.name as category_name, v.name as vendor_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN vendors v ON i.vendor_id = v.id
    ${whereClause}
    ORDER BY i.name
    LIMIT ?
  `).all(...values, limit) as ItemWithRelations[];

  return filterResults(items, { tags });
}

function filterResults(
  items: ItemWithRelations[],
  filters: { category?: string; location?: string; tags?: string[] }
): ItemWithRelations[] {
  let result = items;

  if (filters.category) {
    result = result.filter((i) => i.category_name?.toLowerCase() === filters.category?.toLowerCase());
  }

  if (filters.location) {
    result = result.filter((i) => i.location?.toLowerCase().includes(filters.location!.toLowerCase()));
  }

  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((item) => {
      const itemTags = item.tags ? JSON.parse(item.tags) : [];
      return filters.tags!.some((tag) =>
        itemTags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    });
  }

  return result;
}

export function checkAvailability(
  partNames: string[]
): { name: string; found: boolean; quantity?: number; location?: string; item_id?: string }[] {
  const db = getDb();
  const results: { name: string; found: boolean; quantity?: number; location?: string; item_id?: string }[] = [];

  for (const partName of partNames) {
    // First try exact match
    let item = db.prepare(`
      SELECT id, name, quantity, location FROM items
      WHERE LOWER(name) = LOWER(?)
    `).get(partName) as { id: string; name: string; quantity: number; location: string | null } | undefined;

    // If no exact match, try partial match
    if (!item) {
      item = db.prepare(`
        SELECT id, name, quantity, location FROM items
        WHERE LOWER(name) LIKE LOWER(?)
        LIMIT 1
      `).get(`%${partName}%`) as { id: string; name: string; quantity: number; location: string | null } | undefined;
    }

    if (item) {
      results.push({
        name: partName,
        found: true,
        quantity: item.quantity,
        location: item.location || undefined,
        item_id: item.id,
      });
    } else {
      results.push({ name: partName, found: false });
    }
  }

  return results;
}

export function findPartsForProject(
  projectDescription: string
): { suggestions: ItemWithRelations[]; keywords: string[] } {
  const db = getDb();

  // Extract potential keywords from project description
  const commonWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'need', 'want', 'use', 'using',
    'build', 'make', 'create', 'project', 'i', 'my', 'me', 'we', 'our',
    'that', 'this', 'these', 'those', 'it', 'its',
  ]);

  const words = projectDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !commonWords.has(w));

  // Get unique keywords
  const keywords = [...new Set(words)];

  if (keywords.length === 0) {
    return { suggestions: [], keywords: [] };
  }

  // Search using FTS with OR operator
  const ftsQuery = keywords.join(' OR ');

  const suggestions = db.prepare(`
    SELECT DISTINCT i.*, c.name as category_name, v.name as vendor_name
    FROM items_fts fts
    JOIN items i ON fts.rowid = i.rowid
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN vendors v ON i.vendor_id = v.id
    WHERE items_fts MATCH ?
    ORDER BY rank
    LIMIT 20
  `).all(ftsQuery) as ItemWithRelations[];

  return { suggestions, keywords };
}
