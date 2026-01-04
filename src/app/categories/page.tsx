import { CategoryList } from '@/components/categories/CategoryList';
import { categoriesRepository } from '@/lib/repositories/categories';

export const metadata = {
  title: 'Categories - Homelab Inventory',
};

export default function CategoriesPage() {
  const categories = categoriesRepository.findAll();

  return <CategoryList categories={categories} />;
}
