/**
 * Cart Modal Component
 * Sidebar cart modal matching ECommerce.Web design
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartItem, CartDataResponse } from '@/models/Cart';
import CartService from '@/services/CartService';
import AuthService from '@/services/AuthService';
import { getImageUrl } from '@/utils/imageUtils';
import ConfirmationModal from '@/components/ConfirmationModal';

const CartModal: React.FC = () => {
  const router = useRouter();
  const [cartData, setCartData] = useState<CartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ cartId: number; itemName: string } | null>(null);

  const loadCartData = async () => {
    try {
      setLoading(true);
      const userId = AuthService.getCurrentUserId();
      
      if (!userId) {
        console.warn('[CartModal] No userId found, user may not be logged in');
        setCartData({ success: false, items: [], total: 0, itemCount: 0, message: 'Please log in to view your cart' });
        setLoading(false);
        return;
      }
      
      console.log('[CartModal] Loading cart data for userId:', userId);
      // Pass userId to ensure correct cart is fetched
      const data = await CartService.getCartData(userId);
      console.log('[CartModal] Cart data received:', data);
      
      if (data && data.success) {
        setCartData(data);
        console.log('[CartModal] Cart loaded successfully:', data.items?.length || 0, 'items');
      } else {
        console.warn('[CartModal] Cart data not successful:', data);
        setCartData(data || { success: false, items: [], total: 0, itemCount: 0, message: 'Failed to load cart' });
      }
    } catch (error) {
      console.error('[CartModal] Error loading cart data:', error);
      // Set empty cart on error
      setCartData({ success: false, items: [], total: 0, itemCount: 0, message: 'Failed to load cart. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Expose loadCartData function globally so it can be called from outside
    (window as any).reloadCartModal = loadCartData;
    
    // Initial load (only if user is logged in)
    const userId = AuthService.getCurrentUserId();
    if (userId) {
      loadCartData();
    }
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log('[CartModal] cartUpdated event received, reloading cart data...');
      loadCartData();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Listen for custom cart modal open event
    const handleCartModalOpen = () => {
      console.log('[CartModal] Custom cartModalOpen event triggered, loading cart data...');
      loadCartData();
    };
    window.addEventListener('cartModalOpen', handleCartModalOpen);
    
    // Also reload cart when modal is shown (Bootstrap modal events)
    const cartModal = document.getElementById('cart_modal');
    const handleModalShow = () => {
      // Reload cart data when modal is shown
      console.log('[CartModal] Modal shown event, reloading cart data...');
      loadCartData();
    };
    
    const handleModalHidden = () => {
      console.log('[CartModal] Modal hidden');
    };
    
    if (cartModal) {
      cartModal.addEventListener('shown.bs.modal', handleModalShow);
      cartModal.addEventListener('hidden.bs.modal', handleModalHidden);
    }
    
    // Also listen for modal show event (before shown)
    const handleModalShowEvent = () => {
      console.log('[CartModal] Modal show event triggered, loading cart data...');
      loadCartData();
    };
    
    if (cartModal) {
      cartModal.addEventListener('show.bs.modal', handleModalShowEvent);
    }
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('cartModalOpen', handleCartModalOpen);
      delete (window as any).reloadCartModal;
      if (cartModal) {
        cartModal.removeEventListener('shown.bs.modal', handleModalShow);
        cartModal.removeEventListener('hidden.bs.modal', handleModalHidden);
        cartModal.removeEventListener('show.bs.modal', handleModalShowEvent);
      }
    };
  }, []);

  const handleUpdateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const result = await CartService.updateCartItemAjax(cartId, newQuantity);
      if (result.success) {
        setCartData(result);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = (cartId: number) => {
    // Find the item to get its name for the confirmation message
    const item = cartData?.items?.find(i => i.id === cartId);
    const itemName = item?.productName || 'this item';
    
    // Store item info and show confirmation modal
    setItemToRemove({ cartId, itemName });
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    
    // Close confirmation modal first
    setShowConfirmModal(false);
    setItemToRemove(null);
    
    // Clean up any backdrop from confirmation modal
    setTimeout(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => {
        // Only remove backdrop if it's from confirmation modal (not cart modal)
        if (backdrop.getAttribute('data-bs-backdrop') !== 'false') {
          backdrop.remove();
        }
      });
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 100);
    
    try {
      console.log('[CartModal] Removing item with cartId:', itemToRemove.cartId);
      const result = await CartService.removeCartItemAjax(itemToRemove.cartId);
      console.log('[CartModal] Remove result:', result);
      
      if (result.success) {
        // If result has items, use it; otherwise reload cart data
        if (result.items && result.items.length >= 0) {
          setCartData(result);
        } else {
          // Reload cart data to get updated list
          await loadCartData();
        }
        // Dispatch event to update cart count in header
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        console.error('[CartModal] Failed to remove item:', result.message);
        alert(result.message || 'Failed to remove item from cart');
        // Still try to reload cart in case item was removed but response was unclear
        await loadCartData();
      }
    } catch (error) {
      console.error('[CartModal] Error removing item:', error);
      alert('Failed to remove item from cart. Please try again.');
      // Try to reload cart anyway
      await loadCartData();
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setItemToRemove(null);
  };

  return (
    <div
      id="cart_modal"
      className="modal fixed-left fade"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="cartModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-aside" role="document">
        <div className="modal-content">
          <div className="modal-header pt-2 pb-2">
            <h4>Cart</h4>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading cart...</p>
              </div>
            ) : cartData && cartData.items && cartData.items.length > 0 ? (
              <div className="cart_main">
                {cartData.items.map((item) => (
                  <div key={item.id} className="itemCarTM">
                    <div className="img_CrT">
                      <img
                        src={getImageUrl(item.imageUrl)}
                        className="img-fluid"
                        alt={item.productName}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="carT_head_main">
                      <div className="p_title">
                        <h5>{item.productName}</h5>
                      </div>
                      <div className="item_price">₹ {item.unitPrice.toFixed(2)}</div>
                      {item.size && <div className="text-muted small">Size: {item.size}</div>}
                      <div className="d-flex justify-content-between mt-2">
                        <div className="add_itam_count">
                          <div className="input-group">
                            <button
                              className="btn pm_btn"
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            >
                              <i className="fa fa-minus"></i>
                            </button>
                            <input
                              type="text"
                              className="form-control text-center"
                              value={item.quantity}
                              readOnly
                              style={{ maxWidth: '60px' }}
                            />
                            <button
                              className="btn pm_btn"
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <i className="fa fa-plus"></i>
                            </button>
                          </div>
                        </div>
                        <div className="delete">
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p>Your cart is empty.</p>
                <Link href="/" className="btn btn-primary" data-bs-dismiss="modal">
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>
          {cartData && cartData.items && cartData.items.length > 0 && (
            <div className="modal-footer d-block sb_ttl">
              <div className="d-flex subtotal">
                <h4>Subtotal</h4>
                <span className="total_price">₹ {cartData.total.toFixed(2)}</span>
              </div>
              <div className="d-block text-center">
                <p>
                  <small>Shipping, taxes, and discounts calculated at checkout.</small>
                </p>
              </div>
              <button
                className="btn form__submit"
                onClick={(e) => {
                  e.preventDefault();
                  // Close modal first using multiple methods for reliability
                  const cartModal = document.getElementById('cart_modal');
                  if (cartModal) {
                    // Try Bootstrap 5 method
                    const bsModal = (window as any).bootstrap?.Modal?.getInstance(cartModal);
                    if (bsModal) {
                      bsModal.hide();
                    } else {
                      // Fallback: use jQuery if available
                      if ((window as any).jQuery) {
                        (window as any).jQuery(cartModal).modal('hide');
                      } else {
                        // Last resort: remove classes and backdrop manually
                        cartModal.classList.remove('show');
                        cartModal.setAttribute('aria-hidden', 'true');
                        cartModal.style.display = 'none';
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                          backdrop.remove();
                        }
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                      }
                    }
                  }
                  // Small delay to ensure modal closes, then navigate
                  setTimeout(() => {
                    router.push('/cart');
                  }, 100);
                }}
              >
                View Cart <i className="fa fa-long-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        id="removeCartItemConfirmModal"
        title="Remove Item from Cart"
        message={`Are you sure you want to remove "${itemToRemove?.itemName || 'this item'}" from your cart? This action cannot be undone.`}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        show={showConfirmModal}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        onClose={handleCancelRemove}
      />
    </div>
  );
};

export default CartModal;

