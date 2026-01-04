import { NextRequest, NextResponse } from 'next/server';
import { categoriesRepository } from '@/lib/repositories/categories';
import { CreateCategorySchema, parseBody } from '@/lib/utils/validation';

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = categoriesRepository.findAll();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = parseBody(CreateCategorySchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = categoriesRepository.findByName(validation.data.name);
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    const category = categoriesRepository.create(validation.data);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
