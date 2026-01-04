import { NextRequest, NextResponse } from 'next/server';
import { imagesRepository } from '@/lib/repositories/images';
import { itemsRepository } from '@/lib/repositories/items';
import { processImage } from '@/lib/services/image-processor';
import { isValidUuid } from '@/lib/utils/uuid';

const MAX_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10') * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST /api/images - Upload and compress image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = formData.get('item_id') as string | null;
    const isPrimary = formData.get('is_primary') === 'true';

    if (!file || !itemId) {
      return NextResponse.json(
        { error: 'File and item_id are required' },
        { status: 400 }
      );
    }

    if (!isValidUuid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Check if item exists
    const item = itemsRepository.findById(itemId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${process.env.MAX_IMAGE_SIZE_MB || 10}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer, file.name);

    // If setting as primary, unset existing primary
    if (isPrimary) {
      imagesRepository.unsetPrimary(itemId);
    }

    // Check if this is the first image for the item - auto set as primary
    const existingCount = imagesRepository.getImageCount(itemId);
    const shouldBePrimary = isPrimary || existingCount === 0;

    const image = imagesRepository.create({
      id: processed.id,
      item_id: itemId,
      filename: processed.filename,
      original_filename: file.name,
      mime_type: processed.mimeType,
      size_bytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height,
      is_primary: shouldBePrimary ? 1 : 0,
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
