import { VendorList } from '@/components/vendors/VendorList';
import { vendorsRepository } from '@/lib/repositories/vendors';

export const metadata = {
  title: 'Vendors - Homelab Inventory',
};

export default function VendorsPage() {
  const vendors = vendorsRepository.findAll();

  return <VendorList vendors={vendors} />;
}
