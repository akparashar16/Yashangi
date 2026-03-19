/**
 * Conditional Layout Component
 * Wraps pages with MainLayout (Header/Footer) only for non-admin routes
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Don't wrap admin routes with MainLayout (they have their own AdminLayout)
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }
  
  // Wrap all other routes with MainLayout (includes Header, Footer, etc.)
  return <MainLayout>{children}</MainLayout>;
};

export default ConditionalLayout;
