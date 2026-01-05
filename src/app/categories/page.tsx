import { CategoryList } from '@/components/categories/CategoryList';
import { categoriesRepository } from '@/lib/repositories/categories';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Categories - Homelab Inventory',
};

export default function CategoriesPage() {
  const categories = categoriesRepository.findAll();

  return <CategoryList categories={categories} />;
}
