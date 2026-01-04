import { NextRequest, NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';
import { generateItemQR, generateLabelQR } from '@/lib/services/qr-generator';
import { isValidUuid } from '@/lib/utils/uuid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/items/[id]/qr - Generate QR code for item
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const item = itemsRepository.findById(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const format = (searchParams.get('format') || 'png') as 'png' | 'svg' | 'dataurl';
    const label = searchParams.get('label') === 'true';
    const size = parseInt(searchParams.get('size') || '200');

    if (label) {
      // Generate label-friendly QR with item name
      const svg = await generateLabelQR(id, item.name);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${item.name.replace(/[^a-z0-9]/gi, '_')}_label.svg"`,
        },
      });
    }

    const qr = await generateItemQR(id, { format, size });

    if (format === 'svg') {
      return new NextResponse(qr as string, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${item.name.replace(/[^a-z0-9]/gi, '_')}.svg"`,
        },
      });
    }

    if (format === 'dataurl') {
      return NextResponse.json({ dataUrl: qr });
    }

    // PNG format - convert Buffer to Uint8Array for Response compatibility
    const buffer = qr as Buffer;
    const uint8Array = new Uint8Array(buffer);
    return new Response(uint8Array as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${item.name.replace(/[^a-z0-9]/gi, '_')}.png"`,
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
