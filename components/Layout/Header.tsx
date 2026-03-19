/**
 * Header Component
 * Main navigation header matching ECommerce.Web design
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AuthService from '@/services/AuthService';
import CartService from '@/services/CartService';
import { AuthResponse } from '@/models/User';

const Header: React.FC = () => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Load user and cart count
    const updateUserAndCart = () => {
      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);
      loadCartCount();
    };

    // Initial load
    updateUserAndCart();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authenticatedUser') {
        updateUserAndCart();
      }
    };

    // Listen for custom login event
    const handleLogin = () => {
      updateUserAndCart();
    };

    // Listen for cart update events
    const handleCartUpdate = () => {
      loadCartCount();
    };

    // Listen for page visibility changes (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateUserAndCart();
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('userLoggedOut', handleLogin);
    window.addEventListener('cartUpdated', handleCartUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh cart count periodically
    const interval = setInterval(loadCartCount, 5000);
    
    // Also refresh when pathname changes (after login redirect)
    updateUserAndCart();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('userLoggedOut', handleLogin);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname]); // Re-run when pathname changes (e.g., after login redirect)

  const loadCartCount = async () => {
    try {
      const count = await CartService.getCartCount();
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setCartCount(0);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('userLoggedOut'));
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="menu_header top-fix" style={{ background: 'black', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 999 }}>
      <div className="container-fluid">
        <nav className="navbar navbar-expand-xl navbar-light align-items-center" style={{ minHeight: '80px' }}>
          <button
            className="navbar-toggler d-xl-none"
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle navigation"
            aria-controls="navbarSupportedContent"
            aria-expanded={showMobileMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <Link className="navbar-brand" href="/">
            <img
              src="/assets/images/StaticProduct/icon.png"
              className="img-fluid"
              style={{ maxHeight: '61px !important' }}
              alt="Yashangi"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/images/logo-placeholder.svg';
              }}
            />
          </Link>

          {/* Mobile Icons */}
          <div className="nav_icon d-block d-xl-none">
            <ul>
              <li>
                <a href="#" data-bs-toggle="modal" data-bs-target="#search_modal">
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50">
                    <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <Link href={user ? '/my-orders' : '/account/login'}>
                  <svg className="svg-icon" x="0px" y="0px" width="25" height="25" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M843.282963 870.115556c-8.438519-140.515556-104.296296-257.422222-233.908148-297.14963C687.881481 536.272593 742.4 456.533333 742.4 364.088889c0-127.241481-103.158519-230.4-230.4-230.4S281.6 236.847407 281.6 364.088889c0 92.444444 54.518519 172.183704 133.12 208.877037-129.611852 39.727407-225.46963 156.634074-233.908148 297.14963-0.663704 10.903704 7.964444 20.195556 18.962963 20.195556l0 0c9.955556 0 18.299259-7.774815 18.962963-17.73037C227.745185 718.506667 355.65037 596.385185 512 596.385185s284.254815 122.121481 293.357037 276.195556c0.568889 9.955556 8.912593 17.73037 18.962963 17.73037C835.318519 890.311111 843.946667 881.019259 843.282963 870.115556zM319.525926 364.088889c0-106.287407 86.186667-192.474074 192.474074-192.474074s192.474074 86.186667 192.474074 192.474074c0 106.287407-86.186667 192.474074-192.474074 192.474074S319.525926 470.376296 319.525926 364.088889z" />
                  </svg>
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const cartModal = document.getElementById('cart_modal');
                    if (cartModal) {
                      // Dispatch custom event to trigger cart reload
                      window.dispatchEvent(new Event('cartModalOpen'));
                      
                      // Try Bootstrap 5 method first
                      const bsModal = (window as any).bootstrap?.Modal?.getInstance(cartModal);
                      if (bsModal) {
                        // Force reload cart data BEFORE showing modal when using getInstance
                        window.dispatchEvent(new Event('cartUpdated'));
                        if ((window as any).reloadCartModal) {
                          (window as any).reloadCartModal();
                        }
                        bsModal.show();
                        // Also reload after a short delay to ensure data is fresh
                        setTimeout(() => {
                          window.dispatchEvent(new Event('cartUpdated'));
                          if ((window as any).reloadCartModal) {
                            (window as any).reloadCartModal();
                          }
                        }, 200);
                      } else {
                        // Fallback: create new modal instance
                        const newModal = new (window as any).bootstrap.Modal(cartModal);
                        newModal.show();
                        // Also call reload function directly as backup
                        setTimeout(() => {
                          window.dispatchEvent(new Event('cartUpdated'));
                          if ((window as any).reloadCartModal) {
                            (window as any).reloadCartModal();
                          }
                        }, 200);
                      }
                    }
                  }}
                  style={{ position: 'relative', cursor: 'pointer' }}
                >
                  <svg x="0px" y="0px" width="20" height="20" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 489 489" xmlSpace="preserve">
                    <g>
                      <path d="M440.1,422.7l-28-315.3c-0.6-7-6.5-12.3-13.4-12.3h-57.6C340.3,42.5,297.3,0,244.5,0s-95.8,42.5-96.6,95.1H90.3 c-7,0-12.8,5.3-13.4,12.3l-28,315.3c0,0.4-0.1,0.8-0.1,1.2c0,35.9,32.9,65.1,73.4,65.1h244.6c40.5,0,73.4-29.2,73.4-65.1 C440.2,423.5,440.2,423.1,440.1,422.7z M244.5,27c37.9,0,68.8,30.4,69.6,68.1H174.9C175.7,57.4,206.6,27,244.5,27z M366.8,462 H122.2c-25.4,0-46-16.8-46.4-37.5l26.8-302.3h45.2v41c0,7.5,6,13.5,13.5,13.5s13.5-6,13.5-13.5v-41h139.3v41 c0,7.5,6,13.5,13.5,13.5s13.5-6,13.5-13.5v-41h45.2l26.9,302.3C412.8,445.2,392.1,462,366.8,462z" />
                    </g>
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="Cart_count"
                      id="cartCount"
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ff6b9d',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </a>
              </li>
            </ul>
          </div>

          <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`} id="navbarSupportedContent">
            <div className="d-block d-xl-none d-flex justify-content-between align-items-center xs_head top_HdR_DblC">
              <h6>All Category</h6>
              <button
                type="button"
                className="close_menU"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <ul className="navbar-nav ms-auto">
              <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <Link className="nav-link" href="/">Home</Link>
              </li>
              
              {/* Ethnic Wear Dropdown - Matching ECommerce.Web exactly */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdownEthnic"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Ethnic Wear
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdownEthnic">
                  <li>
                    <Link className="dropdown-item" href="/collection/kurta">Kurtas</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/collection/kurta-set">Kurta Sets</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/collection/kurti">Kurti</Link>
                  </li>
                </ul>
              </li>

              {/* Western Wear Dropdown - Matching ECommerce.Web exactly */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdownWestern"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Western Wear
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdownWestern">
                  <li>
                    <Link className="dropdown-item" href="/collection/top">Top</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/collection/dress">Dress</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/collection/co-ord-set">Co-Ord Set</Link>
                  </li>
                </ul>
              </li>

              {/* Contact US */}
              <li className={`nav-item ${isActive('/contact-us') ? 'active' : ''}`}>
                <Link className="nav-link" href="/contact-us">Contact US</Link>
              </li>
            </ul>

            <ul className="navbar-nav icon_dv" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'right', gap: '15px', justifyContent: 'flex-end', width: 'auto' }}>
              {user ? (
                <>
                  <li className="nav-item d-flex align-items-center">
                    <span className="navbar-text txtname" style={{ color: 'navajowhite !important', margin: 0 }}>
                      Hello, {user.firstName}
                    </span>
                  </li>
                  <li className="nav-item">
                    <Link
                      className="nav-link txtname"
                      href="/my-orders"
                      style={{ color: '#ff6b9d !important', padding: '0.5rem 0.75rem' }}
                    >
                      <i className="fa fa-shopping-bag"></i> My Orders
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button
                      onClick={handleLogout}
                      className="btn btn-link nav-link text-dark txtname"
                      style={{ color: '#ff6b9d !important', border: 'none', background: 'none', padding: '0.5rem 0.75rem', textDecoration: 'none' }}
                    >
                      Logout
                    </button>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    const cartModal = document.getElementById('cart_modal');
                    if (cartModal) {
                      // Dispatch custom event to trigger cart reload
                      window.dispatchEvent(new Event('cartModalOpen'));
                      
                      // Try Bootstrap 5 method first
                      const bsModal = (window as any).bootstrap?.Modal?.getInstance(cartModal);
                      if (bsModal) {
                        // Force reload cart data BEFORE showing modal when using getInstance
                        window.dispatchEvent(new Event('cartUpdated'));
                        if ((window as any).reloadCartModal) {
                          (window as any).reloadCartModal();
                        }
                        bsModal.show();
                        // Also reload after a short delay to ensure data is fresh
                        setTimeout(() => {
                          window.dispatchEvent(new Event('cartUpdated'));
                          if ((window as any).reloadCartModal) {
                            (window as any).reloadCartModal();
                          }
                        }, 200);
                      } else {
                        // Fallback: create new modal instance
                        const newModal = new (window as any).bootstrap.Modal(cartModal);
                        newModal.show();
                        // Also call reload function directly as backup
                        setTimeout(() => {
                          window.dispatchEvent(new Event('cartUpdated'));
                          if ((window as any).reloadCartModal) {
                            (window as any).reloadCartModal();
                          }
                        }, 200);
                      }
                    }
                  }}
                      style={{ position: 'relative', cursor: 'pointer', padding: '0.5rem 0.75rem' }}
                    >
                      <svg
                        x="0px"
                        y="0px"
                        width="20"
                        height="20"
                        version="1.1"
                        id="Capa_1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 489 489"
                      >
                        <g>
                          <path d="M440.1,422.7l-28-315.3c-0.6-7-6.5-12.3-13.4-12.3h-57.6C340.3,42.5,297.3,0,244.5,0s-95.8,42.5-96.6,95.1H90.3 c-7,0-12.8,5.3-13.4,12.3l-28,315.3c0,0.4-0.1,0.8-0.1,1.2c0,35.9,32.9,65.1,73.4,65.1h244.6c40.5,0,73.4-29.2,73.4-65.1 C440.2,423.5,440.2,423.1,440.1,422.7z M244.5,27c37.9,0,68.8,30.4,69.6,68.1H174.9C175.7,57.4,206.6,27,244.5,27z M366.8,462 H122.2c-25.4,0-46-16.8-46.4-37.5l26.8-302.3h45.2v41c0,7.5,6,13.5,13.5,13.5s13.5-6,13.5-13.5v-41h139.3v41 c0,7.5,6,13.5,13.5,13.5s13.5-6,13.5-13.5v-41h45.2l26.9,302.3C412.8,445.2,392.1,462,366.8,462z" />
                        </g>
                      </svg>
                      {cartCount > 0 && (
                        <span
                          className="Cart_count"
                          id="cartCountDesktop"
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ff6b9d',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                          }}
                        >
                          {cartCount}
                        </span>
                      )}
                    </a>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    href="/account/login" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      padding: '0.5rem 0.75rem',
                      color: '#fff'
                    }}
                  >
                    <i className="fa fa-user" style={{ marginRight: '5px' }}></i> Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

