import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { getDb } from '@/lib/db';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

async function getStats() {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_items,
      SUM(CASE WHEN tracking_mode = 'quantity' THEN quantity ELSE 1 END) as total_units,
      COUNT(DISTINCT category_id) as categories_used,
      COUNT(DISTINCT location) as unique_locations,
      SUM(CASE WHEN tracking_mode = 'quantity' AND quantity <= min_quantity AND min_quantity > 0 THEN 1 ELSE 0 END) as low_stock_items
    FROM items
  `).get() as {
    total_items: number;
    total_units: number;
    categories_used: number;
    unique_locations: number;
    low_stock_items: number;
  };

  const recentItems = db.prepare(`
    SELECT id, name, tracking_mode, quantity, unit, location, created_at
    FROM items
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as {
    id: string;
    name: string;
    tracking_mode: string;
    quantity: number;
    unit: string;
    location: string | null;
    created_at: string;
  }[];

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

  return { stats, recentItems, lowStockItems };
}

export default async function DashboardPage() {
  const { stats, recentItems, lowStockItems } = await getStats();

  const statCards = [
    {
      label: 'Total Items',
      value: stats.total_items || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Total Units',
      value: stats.total_units || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Locations',
      value: stats.unique_locations || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Low Stock',
      value: stats.low_stock_items || 0,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: stats.low_stock_items > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-600 bg-gray-50 dark:bg-gray-800',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of your home lab inventory
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent items */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Added</CardTitle>
            <Link
              href="/items"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No items yet.{' '}
                <Link href="/items/new" className="text-primary-600 hover:underline">
                  Add your first item
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.location || 'No location'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.tracking_mode === 'quantity'
                        ? `${item.quantity} ${item.unit}`
                        : 'Individual'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            {lowStockItems.length > 0 && (
              <Link
                href="/items?low_stock=true"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View all →
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="h-12 w-12 mx-auto text-green-500 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">All items are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </div>
                      <div className="text-sm text-red-500">
                        {item.quantity} / {item.min_quantity} {item.unit}
                      </div>
                    </div>
                    <div className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-400">
                      Low
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/items/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
            >
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Add Item</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Add new inventory item
                </div>
              </div>
            </Link>

            <Link
              href="/import"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
            >
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Import CSV</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Bulk import items</div>
              </div>
            </Link>

            <Link
              href="/categories"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
            >
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Categories</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manage categories</div>
              </div>
            </Link>

            <Link
              href="/vendors"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
            >
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Vendors</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manage vendors</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
