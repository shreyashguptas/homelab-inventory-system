import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/stats - Dashboard statistics
export async function GET() {
  try {
    const db = getDb();

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN tracking_mode = 'quantity' THEN quantity ELSE 1 END) as total_units,
        COUNT(DISTINCT category_id) as categories_used,
        COUNT(DISTINCT location) as unique_locations,
        SUM(CASE WHEN tracking_mode = 'quantity' AND quantity <= min_quantity AND min_quantity > 0 THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN purchase_price IS NOT NULL THEN
          CASE WHEN tracking_mode = 'quantity' THEN purchase_price * quantity ELSE purchase_price END
        ELSE 0 END) as total_value
      FROM items
    `).get() as {
      total_items: number;
      total_units: number;
      categories_used: number;
      unique_locations: number;
      low_stock_items: number;
      total_value: number;
    };

    // Get recent items
    const recentItems = db.prepare(`
      SELECT id, name, tracking_mode, quantity, location, created_at
      FROM items
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Get category distribution
    const categoryDistribution = db.prepare(`
      SELECT c.name, c.color, COUNT(i.id) as count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id
      HAVING count > 0
      ORDER BY count DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      stats: {
        total_items: stats.total_items || 0,
        total_units: stats.total_units || 0,
        categories_used: stats.categories_used || 0,
        unique_locations: stats.unique_locations || 0,
        low_stock_items: stats.low_stock_items || 0,
        total_value: Math.round((stats.total_value || 0) * 100) / 100,
      },
      recent_items: recentItems,
      category_distribution: categoryDistribution,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
