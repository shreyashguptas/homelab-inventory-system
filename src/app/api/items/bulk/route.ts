import { NextRequest, NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';
import { isValidUuid } from '@/lib/utils/uuid';
import { z } from 'zod';

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

// POST /api/items/bulk - Bulk operations on items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'delete') {
      const validation = BulkDeleteSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { ids } = validation.data;

      // Validate all IDs
      const invalidIds = ids.filter((id) => !isValidUuid(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: 'Invalid item IDs', invalidIds },
          { status: 400 }
        );
      }

      // Delete each item
      let deletedCount = 0;
      const errors: { id: string; error: string }[] = [];

      for (const id of ids) {
        try {
          const deleted = itemsRepository.delete(id);
          if (deleted) {
            deletedCount++;
          } else {
            errors.push({ id, error: 'Item not found' });
          }
        } catch (err) {
          errors.push({ id, error: 'Failed to delete' });
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}
