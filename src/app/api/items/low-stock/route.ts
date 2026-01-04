import { NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';

// GET /api/items/low-stock - Get items below minimum quantity
export async function GET() {
  try {
    const items = itemsRepository.getLowStock();

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return NextResponse.json({ error: 'Failed to fetch low stock items' }, { status: 500 });
  }
}
