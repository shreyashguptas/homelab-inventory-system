import Link from 'next/link';
import { notFound } from 'next/navigation';
import { itemsRepository } from '@/lib/repositories/items';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { ItemActions } from '@/components/items/ItemActions';
import { ImageGallery } from '@/components/images/ImageGallery';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = itemsRepository.findById(id);

  if (!item) {
    notFound();
  }

  const isLowStock =
    item.tracking_mode === 'quantity' &&
    item.min_quantity > 0 &&
    item.quantity <= item.min_quantity;

  const specs = item.specifications_parsed;
  const tags = item.tags_parsed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/items" className="hover:text-gray-700 dark:hover:text-gray-200">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            {item.name}
            {isLowStock && <Badge variant="danger">Low Stock</Badge>}
          </h1>
          {item.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{item.description}</p>
          )}
        </div>
        <ItemActions item={item} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {item.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery images={item.images} />
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* Tracking info */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tracking Mode
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100 capitalize">
                    {item.tracking_mode === 'quantity' ? 'Quantity-based' : 'Individual item'}
                  </dd>
                </div>

                {item.tracking_mode === 'quantity' ? (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Quantity
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-gray-100">
                        {item.quantity} {item.unit}
                        {item.min_quantity > 0 && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            (min: {item.min_quantity})
                          </span>
                        )}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Condition
                      </dt>
                      <dd className="mt-1">
                        <Badge
                          variant={
                            item.condition === 'new'
                              ? 'success'
                              : item.condition === 'working'
                              ? 'info'
                              : item.condition === 'needs_repair'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {item.condition.replace('_', ' ')}
                        </Badge>
                      </dd>
                    </div>
                    {item.serial_number && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Serial Number
                        </dt>
                        <dd className="mt-1 text-gray-900 dark:text-gray-100 font-mono">
                          {item.serial_number}
                        </dd>
                      </div>
                    )}
                    {item.asset_tag && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Asset Tag
                        </dt>
                        <dd className="mt-1 text-gray-900 dark:text-gray-100 font-mono">
                          {item.asset_tag}
                        </dd>
                      </div>
                    )}
                  </>
                )}

                {item.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Location
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">{item.location}</dd>
                  </div>
                )}

                {item.category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="text-gray-900 dark:text-gray-100">{item.category.name}</span>
                    </dd>
                  </div>
                )}

                {item.vendor && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                      {item.vendor.website ? (
                        <a
                          href={item.vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline dark:text-primary-400"
                        >
                          {item.vendor.name}
                        </a>
                      ) : (
                        item.vendor.name
                      )}
                    </dd>
                  </div>
                )}

                {item.purchase_price && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Purchase Price
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                      {item.purchase_currency} {item.purchase_price.toFixed(2)}
                    </dd>
                  </div>
                )}

                {item.purchase_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Purchase Date
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">{item.purchase_date}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Specifications */}
          {Object.keys(specs).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-gray-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {item.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeDisplay itemId={item.id} itemName={item.name} />
            </CardContent>
          </Card>

          {/* Tags */}
          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {(item.purchase_url || item.datasheet_url) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.purchase_url && (
                  <a
                    href={item.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Purchase Link
                  </a>
                )}
                {item.datasheet_url && (
                  <a
                    href={item.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Datasheet
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                  <dd className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">
                    {item.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {new Date(item.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Updated</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {new Date(item.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
