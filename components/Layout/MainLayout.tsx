/**
 * Main Layout Component
 * Wraps all pages with header, footer, and cart modal
 */

'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import Header from './Header';
import Footer from './Footer';
import CartModal from './CartModal';
import SearchModal from './SearchModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Bootstrap dropdowns and modals after scripts load
    if (typeof window !== 'undefined' && (window as any).bootstrap) {
      // Bootstrap is already loaded via CDN in layout.tsx
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        .txtname {
          color: navajowhite !important;
        }
        /* Hide toggle button on desktop - show only on mobile */
        .navbar-toggler {
          display: block;
        }
        @media (min-width: 1200px) {
          .navbar-toggler {
            display: none !important;
          }
        }
        /* CRITICAL: Ensure navbar is visible on desktop - override ALL responsive styles */
        @media (min-width: 1200px) {
          .menu_header .navbar-expand-xl .navbar-collapse,
          .navbar-expand-xl .navbar-collapse,
          .navbar-collapse {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: static !important;
            width: auto !important;
            height: auto !important;
            background: transparent !important;
            box-shadow: none !important;
            overflow: visible !important;
            top: auto !important;
            left: auto !important;
            z-index: auto !important;
          }
          .menu_header .navbar-expand-xl .navbar-nav,
          .navbar-expand-xl .navbar-nav {
            flex-direction: row !important;
            align-items: center !important;
            display: flex !important;
            visibility: visible !important;
          }
          .menu_header .navbar-expand-xl .navbar-nav .nav-link,
          .navbar-expand-xl .navbar-nav .nav-link {
            color: #fff !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 25px 25px !important;
            white-space: nowrap !important;
          }
        }
        /* Ensure nav links are visible on all screens */
        .navbar-expand-xl .navbar-nav .nav-link {
          color: #fff !important;
        }
        /* Ensure dropdown menus work properly */
        .dropdown-menu {
          position: absolute !important;
        }
        .dropdown:hover .dropdown-menu,
        .dropdown.show .dropdown-menu {
          display: block !important;
        }
        /* Ensure icon_dv is visible */
        .icon_dv {
          display: flex !important;
        }
        .icon_dv .nav-link {
          color: #fff !important;
        }
        .icon_dv .nav-link svg {
          fill: #fff !important;
        }
      `}</style>
      <Header />
      <main style={{ paddingTop: '80px' }}>{children}</main>
      <Footer />
      <CartModal />
      <SearchModal />
    </>
  );
};

export default MainLayout;

