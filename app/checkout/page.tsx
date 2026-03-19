/**
 * Checkout Page
 * Handles order placement and payment
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CartItem } from '@/models/Cart';
import { CheckoutFormData } from '@/models/Order';
import CartService from '@/services/CartService';
import CheckoutService from '@/services/CheckoutService';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';
import { getImageUrl } from '@/utils/imageUtils';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    phone: '',
    country: '1',
    paymentMethod: 'PhonePe',
  });

  useEffect(() => {
    // Check if user is logged in
    if (!AuthService.isAuthenticated()) {
      router.push('/account/login?returnUrl=/checkout');
      return;
    }

    // Load user data to pre-fill form
    const user = AuthService.getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        // phone is not available in AuthResponse, user will need to enter it
      }));
    }

    loadCart();
  }, [router]);

  // Auto-apply voucher from URL after cart is loaded
  useEffect(() => {
    const voucherFromUrl = searchParams?.get('voucher');
    if (voucherFromUrl && !appliedVoucher && total > 0 && !loading) {
      setVoucherCode(voucherFromUrl);
      // Apply voucher automatically
      const applyVoucher = async () => {
        await handleApplyVoucherAuto(voucherFromUrl, total);
      };
      applyVoucher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, loading]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const userId = AuthService.getCurrentUserId();
      
      if (!userId) {
        router.push('/account/login?returnUrl=/checkout');
        return;
      }

      const cartData = await CartService.getCartData(userId);
      
      if (cartData && cartData.success) {
        setCartItems(cartData.items || []);
        let calculatedTotal = 0;
        if (cartData.total !== undefined) {
          calculatedTotal = cartData.total;
        } else if (cartData.items && cartData.items.length > 0) {
          calculatedTotal = cartData.items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice || 0) * (item.quantity || 0)), 0);
        }
        setTotal(calculatedTotal);
        
        // Auto-apply voucher from URL if present (will be handled in separate effect)
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
      setCartItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyVoucherAuto = async (code: string, amount: number) => {
    if (!code.trim()) return;

    setValidatingVoucher(true);
    setVoucherError('');

    try {
      const result = await VoucherService.validateVoucher(code, amount);
      
      if (result.isValid && result.discountAmount !== undefined) {
        setAppliedVoucher({
          code: code.trim().toUpperCase(),
          discountAmount: result.discountAmount,
        });
        setDiscount(result.discountAmount);
        setVoucherCode(code.trim().toUpperCase());
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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    await handleApplyVoucherAuto(voucherCode, total);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
    setVoucherError('');
  };

  const finalTotal = Math.max(0, total - discount);

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.firstName || formData.firstName.trim() === '') {
      setError('Please enter your first name');
      return false;
    }
    if (!formData.lastName || formData.lastName.trim() === '') {
      setError('Please enter your last name');
      return false;
    }
    if (!formData.phone || formData.phone.trim() === '') {
      setError('Please enter your phone number');
      return false;
    }
    if (!formData.address || formData.address.trim() === '') {
      setError('Please enter your address');
      return false;
    }
    if (!formData.city || formData.city.trim() === '') {
      setError('Please enter your city');
      return false;
    }
    if (!formData.state || formData.state.trim() === '') {
      setError('Please enter your state');
      return false;
    }
    if (!formData.pincode || formData.pincode.trim() === '') {
      setError('Please enter your pincode');
      return false;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items to cart before checkout.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    // Prevent duplicate submissions
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await CheckoutService.submitCheckout(formData, cartItems, finalTotal, appliedVoucher?.code);
      
      if (result.success) {
        if (result.redirectUrl) {
          // Redirect to payment gateway (PhonePe)
          window.location.href = result.redirectUrl;
        } else {
          // If no redirect URL, show success message and redirect to orders
          alert('Order placed successfully!');
          window.dispatchEvent(new Event('cartUpdated'));
          router.push('/my-orders');
        }
      } else {
        // Check if it's an OAuth error and provide helpful message
        const errorMessage = result.error || 'Failed to process checkout. Please try again.';
        
        if (errorMessage.includes('Connection') || errorMessage.includes('connection') || 
            errorMessage.includes('timeout') || errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network') || errorMessage.includes('api-preprod.phonepe.com') ||
            errorMessage.includes('api.phonepe.com')) {
          setError(
            '⚠️ PhonePe API Connection Error\n\n' +
            'Unable to connect to PhonePe payment gateway. This could be due to:\n\n' +
            '• Network connectivity issues\n' +
            '• PhonePe API server is temporarily unavailable\n' +
            '• Firewall or proxy blocking the connection\n' +
            '• Incorrect API endpoint configuration\n\n' +
            'Please try:\n' +
            '• Select "Cash on Delivery" or another payment method\n' +
            '• Try again in a few minutes\n' +
            '• Contact support if the issue persists\n\n' +
            'Note: This is a connection issue with PhonePe\'s servers.'
          );
        } else if (errorMessage.includes('OAuth') || errorMessage.includes('PhonePe') || errorMessage.includes('Failed to authenticate')) {
          // Extract the detailed error message
          const detailedError = errorMessage.includes('\n') 
            ? errorMessage.split('\n').slice(0, 3).join('\n') // Show first few lines
            : errorMessage;
          
          setError(
            '⚠️ PhonePe Payment Gateway Configuration Error\n\n' +
            'The PhonePe payment gateway is currently unavailable due to server configuration issues.\n\n' +
            'Please try one of these options:\n' +
            '• Select "Cash on Delivery" or another payment method\n' +
            '• Contact support if you need to use PhonePe\n\n' +
            'Note: This is a backend configuration issue that needs to be fixed by the administrator.'
          );
        } else if (errorMessage.includes('404') || errorMessage.includes('Tried endpoints')) {
          // Show detailed error for 404 with list of tried endpoints
          setError(
            '❌ Order Placement Failed: API Endpoint Not Found\n\n' +
            'The backend API endpoint for placing orders could not be found.\n\n' +
            errorMessage + '\n\n' +
            'Please verify:\n' +
            '• The backend API is running and accessible\n' +
            '• One of the listed endpoints exists on the backend\n' +
            '• The endpoint path matches the backend route configuration\n' +
            '• Contact your backend developer to confirm the correct endpoint'
          );
        } else {
          setError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Error submitting checkout:', error);
      setError(error?.message || 'Failed to process checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (cartItems.length === 0) {
    return (
      <div className="logininner_main">
        <div className="container">
          <div className="alert alert-info text-center">
            <h4>Your cart is empty</h4>
            <p>Please add items to your cart before checkout.</p>
            <Link href="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row">
          <div className="col-12 mb-4">
            <h2 className="text-center">Checkout</h2>
          </div>
        </div>

        <div className="row">
          {/* Checkout Form */}
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h4>Shipping Information</h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-start">
                      <i className="fa fa-exclamation-triangle me-2 mt-1" style={{ fontSize: '1.2rem' }}></i>
                      <div className="flex-grow-1">
                        <strong>Payment Error:</strong>
                        <div className="mt-2" style={{ whiteSpace: 'pre-line' }}>{error}</div>
                        {(error.includes('PhonePe') || error.includes('Connection') || error.includes('timeout')) && (
                          <div className="mt-3">
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, paymentMethod: 'Cash on Delivery' }));
                                  setError('');
                                }}
                              >
                                <i className="fa fa-money-bill me-1"></i>Switch to Cash on Delivery
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, paymentMethod: 'Credit Card' }));
                                  setError('');
                                }}
                              >
                                <i className="fa fa-credit-card me-1"></i>Switch to Credit Card
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setError('')}
                              >
                                <i className="fa fa-times me-1"></i>Dismiss
                              </button>
                            </div>
                            <div className="mt-2">
                              <small className="text-muted">
                                {error.includes('Connection') || error.includes('timeout') ? (
                                  <>
                                    <strong>Note:</strong> This is a connection issue with PhonePe's API servers. 
                                    The backend cannot reach PhonePe's payment gateway. This may be temporary or require network/firewall configuration.
                                  </>
                                ) : (
                                  <>
                                    <strong>Note:</strong> This is a backend PhonePe configuration issue. 
                                    The administrator needs to verify PhonePe credentials in the server configuration.
                                  </>
                                )}
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      Address <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label">
                        City <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="state" className="form-label">
                        State <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="pincode" className="form-label">
                        Pincode <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{6}"
                        title="Please enter a valid 6-digit pincode"
                      />
                    </div>
                  </div>

                  {/* Voucher Code Section */}
                  <div className="mb-3">
                    <label htmlFor="voucherCode" className="form-label">
                      <i className="fa fa-ticket-alt me-2"></i>Voucher Code
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className={`form-control ${voucherError ? 'is-invalid' : ''}`}
                        id="voucherCode"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherError('');
                        }}
                        placeholder="Enter voucher code"
                        disabled={!!appliedVoucher || validatingVoucher}
                      />
                      {appliedVoucher ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={handleRemoveVoucher}
                        >
                          <i className="fa fa-times"></i> Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleApplyVoucher}
                          disabled={validatingVoucher || !voucherCode.trim()}
                        >
                          {validatingVoucher ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1"></span>
                              Validating...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-check me-1"></i>Apply
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {voucherError && (
                      <div className="invalid-feedback d-block">{voucherError}</div>
                    )}
                    {appliedVoucher && (
                      <div className="text-success small mt-1">
                        <i className="fa fa-check-circle me-1"></i>
                        Voucher "{appliedVoucher.code}" applied! You saved ₹{appliedVoucher.discountAmount.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="paymentMethod" className="form-label">
                      Payment Method <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="PhonePe">PhonePe</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <Link href="/cart" className="btn btn-secondary">
                      <i className="fa fa-arrow-left"></i> Back to Cart
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order <i className="fa fa-arrow-right ms-2"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h4>Order Summary</h4>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.productName}
                            className="img-thumbnail me-2"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/images/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="fw-bold small">{item.productName}</div>
                            <div className="text-muted small">
                              Qty: {item.quantity}
                              {item.size && ` • Size: ${item.size}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">₹ {item.lineTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>₹ {total.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <span>₹ 0.00</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Discount
                      {appliedVoucher && (
                        <span className="text-success small ms-1">
                          ({appliedVoucher.code})
                        </span>
                      )}
                      :
                    </span>
                    <span className={discount > 0 ? 'text-success' : ''}>
                      -₹ {discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-2">
                    <span>Total:</span>
                    <span>₹ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
