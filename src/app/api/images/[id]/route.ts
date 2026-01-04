import { NextRequest, NextResponse } from 'next/server';
import { imagesRepository } from '@/lib/repositories/images';
import { getImagePath, getThumbnailPath, deleteImage, imageExists } from '@/lib/services/image-processor';
import { isValidUuid } from '@/lib/utils/uuid';
import fs from 'fs/promises';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/images/[id] - Serve image file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const thumbnail = searchParams.get('thumb') === 'true';

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = imagesRepository.findById(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imagePath = thumbnail ? getThumbnailPath(image.filename) : getImagePath(image.filename);

    // Check if file exists
    if (!(await imageExists(image.filename))) {
      return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(imagePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': image.mime_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}

// PATCH /api/images/[id] - Set as primary
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = imagesRepository.findById(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    imagesRepository.setPrimary(id, image.item_id);

    const updatedImage = imagesRepository.findById(id);

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

// DELETE /api/images/[id] - Delete image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = imagesRepository.delete(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete file from disk
    await deleteImage(image.filename);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
