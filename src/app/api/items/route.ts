import { NextRequest, NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';
import { CreateItemSchema, parseBody } from '@/lib/utils/validation';
import type { TrackingMode } from '@/lib/types/database';

// GET /api/items - List all items with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      category: searchParams.get('category') || undefined,
      vendor: searchParams.get('vendor') || undefined,
      location: searchParams.get('location') || undefined,
      tracking_mode: (searchParams.get('tracking_mode') as TrackingMode) || undefined,
      low_stock: searchParams.get('low_stock') === 'true',
      q: searchParams.get('q') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      sort_by: searchParams.get('sort_by') || 'updated_at',
      sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    };

    const result = itemsRepository.findAll(params);

    return NextResponse.json({
      items: result.items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = parseBody(CreateItemSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const item = itemsRepository.create(validation.data);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
