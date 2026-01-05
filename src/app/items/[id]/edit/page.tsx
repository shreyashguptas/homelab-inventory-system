import { notFound } from 'next/navigation';
import { ItemForm } from '@/components/items/ItemForm';
import { itemsRepository } from '@/lib/repositories/items';
import { categoriesRepository } from '@/lib/repositories/categories';
import { vendorsRepository } from '@/lib/repositories/vendors';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditItemPageProps) {
  const { id } = await params;
  const item = itemsRepository.findById(id);

  if (!item) {
    return { title: 'Item Not Found - Homelab Inventory' };
  }

  return {
    title: `Edit ${item.name} - Homelab Inventory`,
  };
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;
  const item = itemsRepository.findById(id);

  if (!item) {
    notFound();
  }

  const categories = categoriesRepository.findAll();
  const vendors = vendorsRepository.findAll();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Item</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Update details for {item.name}
        </p>
      </div>

      <ItemForm item={item} categories={categories} vendors={vendors} />
    </div>
  );
}
