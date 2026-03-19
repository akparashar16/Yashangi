/**
 * Cart Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/models/Cart';
import CartService from '@/services/CartService';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';
import { getImageUrl } from '@/utils/imageUtils';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ cartId: number; itemName: string } | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadCart();
    
    // Listen for cart updates (when items are added/removed from other pages)
    const handleCartUpdate = () => {
      loadCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCart = async () => {
    try {
    
      setLoading(true);
      const userId = AuthService.getCurrentUserId();
      
      if (!userId) {
        router.push('/account/login?returnUrl=/cart');
        return;
      }

      // Use getCartData (uses Next.js API route, more reliable and handles CORS)
      // Pass userId to help the API route fetch the correct cart
      const cartData = await CartService.getCartData(userId);
      
      if (cartData && cartData.success) {
        // Set cart items (even if empty array)
        setCartItems(cartData.items || []);
        // Calculate total from cartData or from items
        if (cartData.total !== undefined) {
          setTotal(cartData.total);
        } else if (cartData.items && cartData.items.length > 0) {
          setTotal(cartData.items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice || 0) * (item.quantity || 0)), 0));
        } else {
          setTotal(0);
        }
      } else {
        // If getCartData fails, try fallback method
        try {
          const items = await CartService.getCartByUserId(userId);
          setCartItems(items || []);
          setTotal(items && items.length > 0 
            ? items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice || 0) * (item.quantity || 0)), 0)
            : 0);
        } catch (fallbackError) {
          console.error('Error loading cart:', fallbackError);
          setCartItems([]);
          setTotal(0);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Set empty state on error
      setCartItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await CartService.updateCartItem(cartId, newQuantity);
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemove = (cartId: number) => {
    // Find the item to get its name for the confirmation message
    const item = cartItems.find(i => i.id === cartId);
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
      backdrops.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 100);
    
    try {
      console.log('[CartPage] Removing item with cartId:', itemToRemove.cartId);
      await CartService.removeCartItem(itemToRemove.cartId);
      // Reload cart to get updated list
      await loadCart();
      // Dispatch event to update cart count in header
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      console.error('[CartPage] Error removing item:', error);
      alert(error?.message || 'Failed to remove item from cart. Please try again.');
      // Try to reload cart anyway
      await loadCart();
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setItemToRemove(null);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    setValidatingVoucher(true);
    setVoucherError('');

    try {
      const result = await VoucherService.validateVoucher(voucherCode, total);
      
      if (result.isValid && result.discountAmount !== undefined) {
        setAppliedVoucher({
          code: voucherCode.trim().toUpperCase(),
          discountAmount: result.discountAmount,
        });
        setDiscount(result.discountAmount);
        setVoucherError('');
      } else {
        setVoucherError(result.message || 'Invalid voucher code');
        setAppliedVoucher(null);
        setDiscount(0);
      }
    } catch (error: any) {
      console.error('Error applying voucher:', error);
      setVoucherError(error.message || 'Failed to apply voucher. Please try again.');
      setAppliedVoucher(null);
      setDiscount(0);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
    setVoucherError('');
  };

  const finalTotal = Math.max(0, total - discount);

  if (loading) {
    return (
      <div className="logininner_main">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row justify-content-between">
          <div className="col-12 text-center mb-4 carth2">
            <h2>Cart</h2>
          </div>
          <div className="col-lg-8">
            {cartItems.length === 0 ? (
              <div className="alert alert-info">
                <p>Your cart is empty. <Link href="/">Go shopping</Link>!</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="itemCarTM order_item">
                  <div className="row align-items-center text-start">
                    <div className="col-4 col-lg-2 col-md-2">
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
                    </div>
                    <div className="col-8 col-lg-5 col-md-5">
                      <h4>
                        <Link href={`/collection/details/${item.productId}`}>
                          {item.productName}
                        </Link>
                      </h4>
                      <div className="item_price">MRP ₹ {item.unitPrice.toFixed(2)}</div>
                      {item.size && <div className="text-muted small">Size: {item.size}</div>}
                    </div>
                    <div className="col-lg-3 col-md-3">
                      <div className="qtypd">
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
                            style={{ maxWidth: '80px' }}
                          />
                          <button
                            className="btn pm_btn"
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <i className="fa fa-plus"></i>
                          </button>
                        </div>
                        <button
                          className="btn cancal_btn mt-2"
                          onClick={() => handleRemove(item.id)}
                        >
                          <i className="fa fa-trash"></i> Remove
                        </button>
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-2 text-end">
                      <div className="item_price">MRP ₹ {item.lineTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="col-lg-4">
            <div className="rightsidebar">
              <div className="price_detail">
                <h3>Order Summary</h3>
                
                {/* Voucher Code Section */}
                <div className="mb-3" style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label htmlFor="voucherCode" className="form-label small fw-bold">
                    <i className="fa fa-ticket-alt me-1"></i>Voucher Code
                  </label>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className={`form-control form-control-sm ${voucherError ? 'is-invalid' : ''}`}
                      id="voucherCode"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherError('');
                      }}
                      placeholder="Enter code"
                      disabled={!!appliedVoucher || validatingVoucher}
                      style={{ fontSize: '14px' }}
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleRemoveVoucher}
                        style={{ fontSize: '12px' }}
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleApplyVoucher}
                        disabled={validatingVoucher || !voucherCode.trim()}
                        style={{ fontSize: '12px' }}
                      >
                        {validatingVoucher ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="fa fa-check"></i>
                        )}
                      </button>
                    )}
                  </div>
                  {voucherError && (
                    <div className="invalid-feedback d-block small" style={{ fontSize: '11px' }}>
                      {voucherError}
                    </div>
                  )}
                  {appliedVoucher && (
                    <div className="text-success small mt-1" style={{ fontSize: '11px' }}>
                      <i className="fa fa-check-circle me-1"></i>
                      "{appliedVoucher.code}" applied! Save ₹{appliedVoucher.discountAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="priceT">
                  Price Total <span>₹ {total.toFixed(2)}</span>
                </div>
                <div className="priceT">
                  Shipping <span>₹ 0.00</span>
                </div>
                <div className="priceT">
                  Discount
                  {appliedVoucher && (
                    <span className="text-success small ms-1">({appliedVoucher.code})</span>
                  )}
                  <span className={discount > 0 ? 'text-success' : ''}>
                    -₹ {discount.toFixed(2)}
                  </span>
                </div>
                <p>
                  Total: <span>MRP ₹{finalTotal.toFixed(2)}</span>
                </p>
                <small>Inclusive of all taxes.</small>
                {cartItems.length > 0 && (
                  <Link 
                    href={`/checkout${appliedVoucher ? `?voucher=${encodeURIComponent(appliedVoucher.code)}` : ''}`}
                    className="btn btn_buyn w-100"
                  >
                    Checkout <span>•</span> <span>₹ {finalTotal.toFixed(2)}</span>
                  </Link>
                )}
                <Link href="/" className="btn btn_cart w-100">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
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
}

