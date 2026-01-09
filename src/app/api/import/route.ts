import { NextRequest, NextResponse } from 'next/server';
import { itemsRepository } from '@/lib/repositories/items';
import { categoriesRepository } from '@/lib/repositories/categories';
import { vendorsRepository } from '@/lib/repositories/vendors';
import { parseCSV } from '@/lib/services/csv';

// POST /api/import - Import items from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const content = await file.text();
    const parseResult = parseCSV(content);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Failed to parse CSV', errors: parseResult.errors },
        { status: 400 }
      );
    }

    // Get existing categories and vendors for lookup
    const categories = categoriesRepository.findAll();
    const vendors = vendorsRepository.findAll();

    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id]));

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; name: string; message: string }[],
      newCategories: [] as string[],
      newVendors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < parseResult.rows.length; i++) {
      const row = parseResult.rows[i];

      try {
        // Resolve category
        let categoryId: string | undefined;
        if (row.category) {
          categoryId = categoryMap.get(row.category.toLowerCase());
          if (!categoryId) {
            // Create new category
            const newCategory = categoriesRepository.create({ name: row.category });
            categoryId = newCategory.id;
            categoryMap.set(row.category.toLowerCase(), categoryId);
            results.newCategories.push(row.category);
          }
        }

        // Resolve vendor
        let vendorId: string | undefined;
        if (row.vendor) {
          vendorId = vendorMap.get(row.vendor.toLowerCase());
          if (!vendorId) {
            // Create new vendor
            const newVendor = vendorsRepository.create({ name: row.vendor });
            vendorId = newVendor.id;
            vendorMap.set(row.vendor.toLowerCase(), vendorId);
            results.newVendors.push(row.vendor);
          }
        }

        // Create item
        itemsRepository.create({
          name: row.name,
          description: row.description,
          tracking_mode: row.tracking_mode || 'quantity',
          quantity: row.quantity,
          min_quantity: row.min_quantity,
          unit: row.unit,
          serial_number: row.serial_number,
          asset_tag: row.asset_tag,
          condition: row.condition,
          location: row.location,
          category_id: categoryId,
          vendor_id: vendorId,
          purchase_price: row.purchase_price,
          purchase_currency: row.purchase_currency,
          purchase_date: row.purchase_date,
          warranty_expiry: row.warranty_expiry,
          purchase_url: row.purchase_url,
          datasheet_url: row.datasheet_url,
          specifications: row.specifications,
          tags: row.tags,
          notes: row.notes,
        });

        results.imported++;
      } catch (err) {
        results.errors.push({
          row: i + 2, // +2 for 0-index and header row
          name: row.name,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing items:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}
