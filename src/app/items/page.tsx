import Link from 'next/link';
import { itemsRepository } from '@/lib/repositories/items';
import { categoriesRepository } from '@/lib/repositories/categories';
import { Card, Badge, Button } from '@/components/ui';
import { ItemFilters } from '@/components/items/ItemFilters';
import { ItemCard } from '@/components/items/ItemCard';
import type { TrackingMode } from '@/lib/types/database';

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

export default async function ItemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 24;

  const { items, total } = itemsRepository.findAll({
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total} {total === 1 ? 'item' : 'items'} in your inventory
          </p>
        </div>
        <Link href="/items/new">
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={{
                pathname: '/items',
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
                pathname: '/items',
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
  );
}
