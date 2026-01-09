import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { ItemFilters } from '@/components/items/ItemFilters';
import { InventoryGrid } from '@/components/items/InventoryGrid';
import { itemsRepository } from '@/lib/repositories/items';
import { categoriesRepository } from '@/lib/repositories/categories';
import { getDb } from '@/lib/db';
import type { TrackingMode } from '@/lib/types/database';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    category?: string;
    location?: string;
    tracking_mode?: TrackingMode;
    low_stock?: string;
    q?: string;
    page?: string;
  }>;
}

async function getStats() {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_items,
      SUM(CASE WHEN tracking_mode = 'quantity' THEN quantity ELSE 1 END) as total_units,
      COUNT(DISTINCT category_id) as categories_used,
      COUNT(DISTINCT location) as unique_locations,
      SUM(CASE WHEN tracking_mode = 'quantity' AND quantity <= min_quantity AND min_quantity > 0 THEN 1 ELSE 0 END) as low_stock_items,
      SUM(
        CASE
          WHEN purchase_price IS NOT NULL THEN
            CASE WHEN tracking_mode = 'quantity' THEN quantity * purchase_price ELSE purchase_price END
          ELSE 0
        END
      ) as total_value
    FROM items
  `).get() as {
    total_items: number;
    total_units: number;
    categories_used: number;
    unique_locations: number;
    low_stock_items: number;
    total_value: number;
  };

  const lowStockItems = db.prepare(`
    SELECT id, name, quantity, min_quantity, unit
    FROM items
    WHERE tracking_mode = 'quantity' AND quantity <= min_quantity AND min_quantity > 0
    ORDER BY (min_quantity - quantity) DESC
    LIMIT 5
  `).all() as {
    id: string;
    name: string;
    quantity: number;
    min_quantity: number;
    unit: string;
  }[];

  return { stats, lowStockItems };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 24;

  const { stats, lowStockItems } = await getStats();
  const { items, total } = itemsRepository.findAllWithImages({
    category: params.category,
    location: params.location,
    tracking_mode: params.tracking_mode,
    low_stock: params.low_stock === 'true',
    q: params.q,
    page,
    limit,
  });

  const categories = categoriesRepository.findAll();
  const locations = itemsRepository.getUniqueLocations();
  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const statCards = [
    {
      label: 'Total Items',
      value: stats.total_items || 0,
      displayValue: (stats.total_items || 0).toLocaleString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Total Units',
      value: stats.total_units || 0,
      displayValue: (stats.total_units || 0).toLocaleString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Value',
      value: stats.total_value || 0,
      displayValue: formatCurrency(stats.total_value || 0),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Locations',
      value: stats.unique_locations || 0,
      displayValue: (stats.unique_locations || 0).toLocaleString(),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid - compact on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div className={`p-2 rounded-lg ${stat.color} flex-shrink-0`}>{stat.icon}</div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {stat.displayValue}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert banner - only show if there are low stock items */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-red-800 dark:text-red-200">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} low on stock
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 truncate">
              {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
              {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
            </div>
          </div>
          <Link
            href="/?low_stock=true"
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            View all
          </Link>
        </div>
      )}

      {/* Inventory section */}
      <div className="space-y-4">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Inventory
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? 'item' : 'items'}
              {(params.category || params.location || params.tracking_mode || params.low_stock || params.q) && ' (filtered)'}
            </p>
          </div>
          <Link href="/import">
            <Button variant="secondary" size="sm">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <ItemFilters
          categories={categories}
          locations={locations}
          currentFilters={{
            category: params.category,
            location: params.location,
            tracking_mode: params.tracking_mode,
            low_stock: params.low_stock === 'true',
            q: params.q,
          }}
        />

        {/* Items grid */}
        {items.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <svg
                className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                No items found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {params.q || params.category || params.location || params.low_stock
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first item'}
              </p>
              <Link href="/items/new">
                <Button>Add your first item</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <InventoryGrid items={items} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: '/',
                  query: { ...params, page: page - 1 },
                }}
              >
                <Button variant="secondary" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={{
                  pathname: '/',
                  query: { ...params, page: page + 1 },
                }}
              >
                <Button variant="secondary" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
