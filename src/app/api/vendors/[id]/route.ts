import { NextRequest, NextResponse } from 'next/server';
import { vendorsRepository } from '@/lib/repositories/vendors';
import { UpdateVendorSchema, parseBody } from '@/lib/utils/validation';
import { isValidUuid } from '@/lib/utils/uuid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vendors/[id] - Get single vendor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const vendor = vendorsRepository.findById(id);

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = parseBody(UpdateVendorSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check for duplicate name if name is being changed
    if (validation.data.name) {
      const existing = vendorsRepository.findByName(validation.data.name);
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Vendor with this name already exists' },
          { status: 409 }
        );
      }
    }

    const vendor = vendorsRepository.update(id, validation.data);

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Delete vendor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const deleted = vendorsRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}
