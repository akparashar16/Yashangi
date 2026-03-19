/**
 * Admin Layout
 * Wraps all admin pages with the AdminLayout component
 */

'use client';

import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/Layout/AdminLayout';

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // Get page title based on route
  const getPageTitle = (): string => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname?.includes('/admin/products/create')) return 'Create Product';
          if (pathname?.includes('/admin/products') && pathname?.includes('/edit')) return 'Edit Product';
          if (pathname?.includes('/admin/products')) return 'Products';
          if (pathname?.includes('/admin/categories') && pathname?.includes('/edit')) return 'Edit Category';
          if (pathname?.includes('/admin/categories') && pathname?.includes('/create')) return 'Create Category';
          if (pathname?.includes('/admin/categories')) return 'Categories';
          if (pathname?.includes('/admin/subcategories') && pathname?.includes('/edit')) return 'Edit Subcategory';
          if (pathname?.includes('/admin/subcategories') && pathname?.includes('/create')) return 'Create Subcategory';
          if (pathname?.includes('/admin/subcategories')) return 'Subcategories';
          if (pathname?.includes('/admin/orders')) return 'Orders';
          if (pathname?.includes('/admin/users') && pathname?.includes('/edit')) return 'Edit User';
          if (pathname?.includes('/admin/users') && pathname?.includes('/create')) return 'Create User';
          if (pathname?.includes('/admin/users')) return 'Users';
          if (pathname?.includes('/admin/vouchers') && pathname?.includes('/edit')) return 'Edit Voucher';
          if (pathname?.includes('/admin/vouchers') && pathname?.includes('/create')) return 'Create Voucher';
          if (pathname?.includes('/admin/vouchers')) return 'Vouchers';
          if (pathname?.includes('/admin/profit-loss')) return 'Profit & Loss';
    return 'Admin';
  };

  return (
    <AdminLayout pageTitle={getPageTitle()}>
      {children}
    </AdminLayout>
  );
}
