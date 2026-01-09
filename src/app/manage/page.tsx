import { ManagePage } from '@/components/manage/ManagePage';
import { categoriesRepository } from '@/lib/repositories/categories';
import { vendorsRepository } from '@/lib/repositories/vendors';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manage - Homelab Inventory',
};

export default function ManagePageRoute() {
  const categories = categoriesRepository.findAll();
  const vendors = vendorsRepository.findAll();

  return <ManagePage categories={categories} vendors={vendors} />;
}
