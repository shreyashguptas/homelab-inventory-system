import { VendorList } from '@/components/vendors/VendorList';
import { vendorsRepository } from '@/lib/repositories/vendors';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Vendors - Homelab Inventory',
};

export default function VendorsPage() {
  const vendors = vendorsRepository.findAll();

  return <VendorList vendors={vendors} />;
}
