/**
 * My Orders Page
 * Displays customer's order history (only successfully created and paid orders)
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OrderService, { OrderDetail } from '@/services/OrderService';
import AuthService from '@/services/AuthService';
import ReviewService from '@/services/ReviewService';
import ReviewModal from '@/components/ReviewModal';
import { getImageUrl } from '@/utils/imageUtils';
import { OrderStatus } from '@/models/Order';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string | undefined;
    productImage?: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: '',
    productImage: undefined,
  });
  const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if user is logged in
    if (!AuthService.isAuthenticated()) {
      router.push('/account/login?returnUrl=/my-orders');
      return;
    }

    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userId = AuthService.getCurrentUserId();
      
      if (!userId) {
        router.push('/account/login?returnUrl=/my-orders');
        return;
      }

      const ordersData = await OrderService.getOrdersByUserId(userId);
      setOrders(ordersData || []);

      // Check which products have been reviewed
      if (ordersData && ordersData.length > 0) {
        const reviewedSet = new Set<number>();
        for (const order of ordersData) {
          if (order.items) {
            for (const item of order.items) {
              const hasReviewed = await ReviewService.hasUserReviewedProduct(item.productId);
              if (hasReviewed) {
                reviewedSet.add(item.productId);
              }
            }
          }
        }
        setReviewedProducts(reviewedSet);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err?.message || 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'badge bg-success';
    if (statusLower === 'shipped') return 'badge bg-info';
    if (statusLower === 'processing') return 'badge bg-warning';
    if (statusLower === 'pending') return 'badge bg-secondary';
    if (statusLower === 'cancelled') return 'badge bg-danger';
    return 'badge bg-secondary';
  };

  const getPaymentStatusBadgeClass = (paymentStatus?: string): string => {
    if (!paymentStatus) return 'badge bg-secondary';
    const statusLower = paymentStatus.toLowerCase();
    if (statusLower === 'success' || statusLower === 'paid' || statusLower === 'completed') {
      return 'badge bg-success';
    }
    if (statusLower === 'processing' || statusLower === 'pending') {
      return 'badge bg-warning';
    }
    if (statusLower === 'failed' || statusLower === 'cancelled') {
      return 'badge bg-danger';
    }
    return 'badge bg-secondary';
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const isOrderExpanded = (orderId: string): boolean => {
    return expandedOrders.has(orderId);
  };

  const handleOpenReviewModal = (productId: number, productName: string | undefined, productImage?: string) => {
    setReviewModal({
      isOpen: true,
      productId,
      productName,
      productImage,
    });
  };

  const handleCloseReviewModal = () => {
    setReviewModal({
      isOpen: false,
      productId: 0,
      productName: '',
      productImage: undefined,
    });
  };

  const handleReviewSubmitted = async () => {
    // Add product to reviewed set
    if (reviewModal.productId) {
      setReviewedProducts(prev => new Set(prev).add(reviewModal.productId));
    }
    // Reload orders to refresh review status
    await loadOrders();
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

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row">
          <div className="col-12 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="carth2">My Orders</h2>
              <Link href="/" className="btn btn-outline-primary">
                <i className="fa fa-arrow-left me-2"></i>Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={loadOrders}
            >
              <i className="fa fa-refresh me-1"></i>Retry
            </button>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="alert alert-info text-center">
            <h4>No Orders Found</h4>
            <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Link href="/" className="btn btn-primary">
              <i className="fa fa-shopping-bag me-2"></i>Start Shopping
            </Link>
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className="row">
            <div className="col-12">
              {orders.map((order) => {
                const isExpanded = isOrderExpanded(order.orderId);
                return (
                  <div key={order.id} className="card mb-4 shadow-sm">
                    <div 
                      className="card-header bg-light order-card-header" 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleOrder(order.orderId)}
                    >
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <button
                              className="btn btn-link p-0 me-2 text-decoration-none"
                              style={{ 
                                border: 'none', 
                                background: 'none',
                                color: 'inherit',
                                fontSize: '1.2rem',
                                minWidth: '30px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrder(order.orderId);
                              }}
                            >
                              <i 
                                className={`fa fa-chevron-${isExpanded ? 'down' : 'right'}`}
                                style={{ transition: 'transform 0.3s ease' }}
                              ></i>
                            </button>
                            <div>
                              <h5 className="mb-0">
                                <strong>Order ID:</strong> {order.orderId}
                              </h5>
                              <small className="text-muted">
                                <i className="fa fa-calendar me-1"></i>
                                {formatDate(order.createdAt)}
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 text-md-end mt-2 mt-md-0">
                          <span className={getStatusBadgeClass(order.status)} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            {order.status}
                          </span>
                          {order.paymentStatus && (
                            <span className={`${getPaymentStatusBadgeClass(order.paymentStatus)} ms-2`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                              Payment: {order.paymentStatus}
                            </span>
                          )}
                          <div className="mt-2">
                            <small className="text-muted">
                              <i className={`fa fa-${isExpanded ? 'eye-slash' : 'eye'} me-1`}></i>
                              {isExpanded ? 'Click to collapse' : 'Click to expand'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div 
                        className="card-body"
                        style={{
                          animation: 'fadeIn 0.3s ease-in-out',
                          animationFillMode: 'both'
                        }}
                      >
                    {order.items && order.items.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th style={{ width: '100px' }}>Image</th>
                                <th>Product</th>
                                <th className="text-center">Size</th>
                                <th className="text-center">Quantity</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Total</th>
                                <th className="text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => {
                                const hasReviewed = reviewedProducts.has(item.productId);
                                return (
                                  <tr key={item.id}>
                                    <td>
                                      <img
                                        src={getImageUrl(item.productImage)}
                                        alt={item.productName}
                                        className="img-thumbnail"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/assets/images/placeholder.svg';
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <div className="fw-bold">{item.productName}</div>
                                      <small className="text-muted">Product ID: {item.productId}</small>
                                    </td>
                                    <td className="text-center">
                                      {item.size ? (
                                        <span className="badge bg-secondary">{item.size}</span>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-light text-dark">{item.quantity}</span>
                                    </td>
                                    <td className="text-end">₹ {item.price.toFixed(2)}</td>
                                    <td className="text-end fw-bold">₹ {item.lineTotal.toFixed(2)}</td>
                                    <td className="text-center">
                                      {hasReviewed ? (
                                        <span className="badge bg-success">
                                          <i className="fa fa-check me-1"></i>Reviewed
                                        </span>
                                      ) : (
                                        <button
                                          className="btn btn-sm btn-outline-primary"
                                          onClick={() => handleOpenReviewModal(
                                            item.productId,
                                            item.productName || '',
                                            item.productImage
                                          )}
                                          title="Write a review"
                                        >
                                          <i className="fa fa-star me-1"></i>
                                          Review
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="row mt-3">
                          <div className="col-md-8">
                            {order.shippingAddress && (
                              <div className="border rounded p-3 bg-light">
                                <h6 className="mb-2">
                                  <i className="fa fa-truck me-2"></i>Shipping Address
                                </h6>
                                <div className="small">
                                  <div>
                                    <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                                  </div>
                                  <div>{order.shippingAddress.address}</div>
                                  <div>
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                  </div>
                                  <div>
                                    <i className="fa fa-phone me-1"></i>{order.shippingAddress.phone}
                                  </div>
                                  <div>
                                    <i className="fa fa-envelope me-1"></i>{order.shippingAddress.email}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <div className="border rounded p-3 bg-light">
                              <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>₹ {order.totalAmount.toFixed(2)}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Shipping:</span>
                                <span>₹ 0.00</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Discount:</span>
                                <span>₹ 0.00</span>
                              </div>
                              <hr />
                              <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>Total:</span>
                                <span className="text-primary">₹ {order.totalAmount.toFixed(2)}</span>
                              </div>
                              {order.paymentMethod && (
                                <div className="mt-2 small text-muted">
                                  <i className="fa fa-credit-card me-1"></i>
                                  Paid via {order.paymentMethod}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No items found in this order.</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Total Amount:</strong> ₹ {order.totalAmount.toFixed(2)}
                          </div>
                          {order.paymentMethod && (
                            <div className="small text-muted">
                              <i className="fa fa-credit-card me-1"></i>
                              Paid via {order.paymentMethod}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={handleCloseReviewModal}
          productId={reviewModal.productId}
          productName={reviewModal.productName || ''}
          productImage={reviewModal.productImage ? getImageUrl(reviewModal.productImage) : undefined}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
}
