import { NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';
import { exportItemsToCSV } from '@/lib/services/csv';

// GET /api/export - Export all items as CSV
export async function GET() {
  try {
    const items = itemsRepository.findAllForExport();

    const csv = exportItemsToCSV(items);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `inventory-export-${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting items:', error);
    return NextResponse.json({ error: 'Failed to export items' }, { status: 500 });
  }
}
