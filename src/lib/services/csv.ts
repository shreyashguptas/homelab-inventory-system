import type { Item, ItemWithRelations } from '../types/database';

// CSV field mapping
const EXPORT_FIELDS = [
  'name',
  'description',
  'tracking_mode',
  'quantity',
  'min_quantity',
  'unit',
  'serial_number',
  'asset_tag',
  'condition',
  'location',
  'category',
  'vendor',
  'purchase_price',
  'purchase_currency',
  'purchase_date',
  'warranty_expiry',
  'purchase_url',
  'datasheet_url',
  'specifications',
  'tags',
  'notes',
] as const;

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

export function exportItemsToCSV(items: ItemWithRelations[]): string {
  const lines: string[] = [];

  // Header row
  lines.push(EXPORT_FIELDS.join(','));

  // Data rows
  for (const item of items) {
    const row = EXPORT_FIELDS.map((field) => {
      switch (field) {
        case 'category':
          return escapeCSV(item.category?.name);
        case 'vendor':
          return escapeCSV(item.vendor?.name);
        case 'specifications':
          return escapeCSV(JSON.stringify(item.specifications_parsed || {}));
        case 'tags':
          return escapeCSV((item.tags_parsed || []).join(';'));
        default:
          return escapeCSV(item[field as keyof Item] as string | null);
      }
    });
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

export interface ParsedCSVRow {
  name: string;
  description?: string;
  tracking_mode?: 'quantity' | 'individual';
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  serial_number?: string;
  asset_tag?: string;
  condition?: 'new' | 'working' | 'needs_repair' | 'broken' | 'retired';
  location?: string;
  category?: string;
  vendor?: string;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_url?: string;
  datasheet_url?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  notes?: string;
}

export interface CSVParseResult {
  success: boolean;
  rows: ParsedCSVRow[];
  errors: { row: number; message: string }[];
}

export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const result: CSVParseResult = {
    success: true,
    rows: [],
    errors: [],
  };

  if (lines.length < 2) {
    result.success = false;
    result.errors.push({ row: 0, message: 'CSV must have a header row and at least one data row' });
    return result;
  }

  // Parse header to get column indices
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  const nameIndex = headers.indexOf('name');
  if (nameIndex === -1) {
    result.success = false;
    result.errors.push({ row: 0, message: 'CSV must have a "name" column' });
    return result;
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const values = parseCSVLine(line);
      const row: ParsedCSVRow = { name: '' };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        if (!value) return;

        switch (header) {
          case 'name':
            row.name = value;
            break;
          case 'description':
            row.description = value;
            break;
          case 'tracking_mode':
            if (value === 'quantity' || value === 'individual') {
              row.tracking_mode = value;
            }
            break;
          case 'quantity':
            row.quantity = parseInt(value) || 0;
            break;
          case 'min_quantity':
            row.min_quantity = parseInt(value) || 0;
            break;
          case 'unit':
            row.unit = value;
            break;
          case 'serial_number':
            row.serial_number = value;
            break;
          case 'asset_tag':
            row.asset_tag = value;
            break;
          case 'condition':
            if (['new', 'working', 'needs_repair', 'broken', 'retired'].includes(value)) {
              row.condition = value as ParsedCSVRow['condition'];
            }
            break;
          case 'location':
            row.location = value;
            break;
          case 'category':
            row.category = value;
            break;
          case 'vendor':
            row.vendor = value;
            break;
          case 'purchase_price':
            row.purchase_price = parseFloat(value) || undefined;
            break;
          case 'purchase_currency':
            row.purchase_currency = value;
            break;
          case 'purchase_date':
            row.purchase_date = value;
            break;
          case 'warranty_expiry':
            row.warranty_expiry = value;
            break;
          case 'purchase_url':
            row.purchase_url = value;
            break;
          case 'datasheet_url':
            row.datasheet_url = value;
            break;
          case 'specifications':
            try {
              row.specifications = JSON.parse(value);
            } catch {
              // Ignore invalid JSON
            }
            break;
          case 'tags':
            row.tags = value.split(';').map((t) => t.trim()).filter(Boolean);
            break;
          case 'notes':
            row.notes = value;
            break;
        }
      });

      if (!row.name) {
        result.errors.push({ row: i + 1, message: 'Name is required' });
        continue;
      }

      result.rows.push(row);
    } catch (err) {
      result.errors.push({ row: i + 1, message: `Failed to parse row: ${err}` });
    }
  }

  if (result.rows.length === 0) {
    result.success = false;
  }

  return result;
}
