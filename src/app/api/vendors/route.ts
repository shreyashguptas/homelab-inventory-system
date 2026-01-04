import { NextRequest, NextResponse } from 'next/server';
import { vendorsRepository } from '@/lib/repositories/vendors';
import { CreateVendorSchema, parseBody } from '@/lib/utils/validation';

// GET /api/vendors - List all vendors
export async function GET() {
  try {
    const vendors = vendorsRepository.findAll();
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = parseBody(CreateVendorSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = vendorsRepository.findByName(validation.data.name);
    if (existing) {
      return NextResponse.json(
        { error: 'Vendor with this name already exists' },
        { status: 409 }
      );
    }

    const vendor = vendorsRepository.create(validation.data);

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
