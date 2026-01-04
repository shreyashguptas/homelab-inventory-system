import { NextRequest, NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';

// GET /api/items/search - Full-text search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (!query || query.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const items = itemsRepository.search(query, limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error searching items:', error);
    return NextResponse.json({ error: 'Failed to search items' }, { status: 500 });
  }
}
