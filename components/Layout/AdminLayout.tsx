/**
 * Admin Layout Component
 * Provides consistent sidebar navigation and layout for admin pages
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AuthService from '@/services/AuthService';
import { AuthResponse } from '@/models/User';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminLayout({ children, pageTitle = 'Dashboard' }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Set initial state based on screen size
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push('/admin/login?returnUrl=' + encodeURIComponent(pathname));
      return;
    }

    setAdmin(currentUser);
    setLoading(false);
    
    // Add body class for admin layout
    document.body.classList.add('admin-layout');
    
    return () => {
      document.body.classList.remove('admin-layout');
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string): boolean => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f7fa'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const adminName = admin ? `${admin.firstName} ${admin.lastName}`.trim() : 'Admin';
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <>
      <style jsx global>{`
        :root {
          --admin-primary-color: #1a1a2e;
          --admin-secondary-color: #16213e;
          --admin-accent-color: #0f3460;
          --admin-success-color: #10b981;
          --admin-warning-color: #f59e0b;
          --admin-danger-color: #ef4444;
          --admin-info-color: #3b82f6;
          --admin-sidebar-width: 260px;
          --admin-header-height: 70px;
        }

        body.admin-layout {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f7fa;
          color: #333;
          overflow-x: hidden;
        }

        /* Sidebar */
        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: var(--admin-sidebar-width);
          height: 100vh;
          background: linear-gradient(180deg, var(--admin-primary-color) 0%, var(--admin-secondary-color) 100%);
          color: white;
          z-index: 1000;
          transition: all 0.3s ease;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }

        .admin-sidebar-header {
          padding: 25px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-sidebar-header .admin-logo {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .admin-sidebar-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .admin-sidebar-menu {
          padding: 20px 0;
        }

        .admin-menu-item {
          padding: 14px 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          cursor: pointer;
        }

        .admin-menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-left-color: white;
        }

        .admin-menu-item.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-left-color: white;
          font-weight: 600;
        }

        .admin-menu-item i {
          width: 20px;
          text-align: center;
          font-size: 18px;
        }

        .admin-sidebar-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .admin-user-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .admin-user-details {
          flex: 1;
        }

        .admin-user-details .admin-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .admin-user-details .admin-role {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .admin-logout-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          padding: 14px 25px;
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          cursor: pointer;
          font-size: 15px;
        }

        .admin-logout-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-left-color: white;
        }

        .admin-logout-btn i {
          width: 20px;
          text-align: center;
          font-size: 18px;
        }

        /* Main Content */
        .admin-main-content {
          margin-left: var(--admin-sidebar-width);
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        /* Header */
        .admin-header {
          height: var(--admin-header-height);
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .admin-header-left h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--admin-primary-color);
          margin: 0;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .admin-header-action {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f5f7fa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--admin-primary-color);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .admin-header-action:hover {
          background: var(--admin-primary-color);
          color: white;
          transform: scale(1.1);
        }

        /* Sidebar Overlay for Mobile */
        .admin-sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          transition: opacity 0.3s ease;
        }

        .admin-sidebar-overlay.show {
          display: block;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .admin-sidebar {
            width: 240px;
          }

          .admin-main-content {
            margin-left: 0;
          }

          .admin-header {
            padding: 0 20px;
          }

          .admin-header-left h1 {
            font-size: 20px;
          }

          .admin-main-content > div {
            padding: 20px !important;
          }
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            width: 280px;
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .admin-sidebar-overlay.show {
            display: block;
          }

          .admin-main-content {
            margin-left: 0;
          }

          .admin-mobile-toggle {
            display: block;
          }

          .admin-header {
            padding: 0 15px;
            height: 60px;
          }

          .admin-header-left h1 {
            font-size: 18px;
          }

          .admin-header-left h1 i {
            font-size: 16px;
            margin-right: 8px;
          }

          .admin-header-action {
            width: 35px;
            height: 35px;
            font-size: 14px;
          }

          .admin-main-content > div {
            padding: 15px !important;
          }

          .admin-sidebar-header {
            padding: 20px 15px;
          }

          .admin-sidebar-header h4 {
            font-size: 16px;
          }

          .admin-menu-item {
            padding: 12px 20px;
            font-size: 14px;
          }

          .admin-menu-item i {
            font-size: 16px;
            width: 18px;
          }
        }

        @media (max-width: 576px) {
          .admin-sidebar {
            width: 100%;
          }

          .admin-header-left h1 {
            font-size: 16px;
          }

          .admin-header-left h1 span {
            display: none;
          }

          .admin-main-content > div {
            padding: 10px !important;
          }

          .admin-sidebar-header {
            padding: 15px;
          }

          .admin-menu-item {
            padding: 12px 15px;
          }

          .admin-user-info {
            padding: 10px;
          }

          .admin-user-avatar {
            width: 35px;
            height: 35px;
            font-size: 14px;
          }

          .admin-user-details .admin-name {
            font-size: 13px;
          }

          .admin-user-details .admin-role {
            font-size: 11px;
          }
        }

        .admin-mobile-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          color: var(--admin-primary-color);
          cursor: pointer;
          padding: 10px;
          margin-right: 15px;
        }

        @media (max-width: 768px) {
          .admin-mobile-toggle {
            display: block;
          }
        }
      `}</style>

      <div className="admin-layout">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div 
            className={`admin-sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-header">
            <div className="admin-logo">
              <i className="fas fa-store"></i>
            </div>
            <h4>Yashangi Admin</h4>
          </div>

          <div className="admin-sidebar-menu">
            <Link 
              href="/admin" 
              className={`admin-menu-item ${isActive('/admin') && !pathname?.includes('/admin/products') && !pathname?.includes('/admin/categories') && !pathname?.includes('/admin/orders') && !pathname?.includes('/admin/users') ? 'active' : ''}`}
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/products" 
              className={`admin-menu-item ${isActive('/admin/products') ? 'active' : ''}`}
            >
              <i className="fas fa-box"></i>
              <span>Products</span>
            </Link>
            <Link 
              href="/admin/categories" 
              className={`admin-menu-item ${isActive('/admin/categories') ? 'active' : ''}`}
            >
              <i className="fas fa-tags"></i>
              <span>Categories</span>
            </Link>
            <Link 
              href="/admin/subcategories" 
              className={`admin-menu-item ${isActive('/admin/subcategories') ? 'active' : ''}`}
            >
              <i className="fas fa-tag"></i>
              <span>Subcategories</span>
            </Link>
            <Link 
              href="/admin/orders" 
              className={`admin-menu-item ${isActive('/admin/orders') ? 'active' : ''}`}
            >
              <i className="fas fa-shopping-cart"></i>
              <span>Orders</span>
            </Link>
            <Link 
              href="/admin/users" 
              className={`admin-menu-item ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <i className="fas fa-users"></i>
              <span>Users</span>
            </Link>
            <Link 
              href="/admin/profit-loss" 
              className={`admin-menu-item ${isActive('/admin/profit-loss') ? 'active' : ''}`}
            >
              <i className="fas fa-chart-line"></i>
              <span>Profit & Loss</span>
            </Link>
          </div>

          <div className="admin-sidebar-footer">
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {adminInitial}
              </div>
              <div className="admin-user-details">
                <div className="admin-name">{adminName}</div>
                <div className="admin-role">Administrator</div>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleLogout} 
              className="admin-logout-btn"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main-content">
          {/* Header */}
          <div className="admin-header">
            <div className="admin-header-left">
              <button 
                className="admin-mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <i className="fas fa-bars"></i>
              </button>
              <h1>
                <i className="fas fa-tachometer-alt" style={{ marginRight: '10px', color: 'var(--admin-info-color)' }}></i>
                {pageTitle}
              </h1>
            </div>
            <div className="admin-header-right">
              <Link href="/" className="admin-header-action" title="View Website">
                <i className="fas fa-external-link-alt"></i>
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <div style={{ padding: '30px', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
