/**
 * Payment Success Page
 * Displays success message after successful payment
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PhonePeService from '@/services/PhonePeService';
import AuthService from '@/services/AuthService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/account/login?returnUrl=/payment/success');
      return;
    }

    // Extract parameters from URL
    const orderIdParam = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('orderID');
    const transactionIdParam = searchParams.get('transactionId') || searchParams.get('transaction_id') || searchParams.get('txnId');

    setOrderId(orderIdParam);
    setTransactionId(transactionIdParam);

    // Update payment status on backend
    if (orderIdParam) {
      updatePaymentStatus(orderIdParam, transactionIdParam || undefined);
    } else {
      setLoading(false);
    }
  }, [router, searchParams]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/my-orders');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, countdown, router]);

  const updatePaymentStatus = async (orderId: string, transactionId?: string) => {
    try {
      // Notify backend about successful payment
      await PhonePeService.updatePaymentStatus({
        orderId,
        status: 'Success',
        transactionId,
        code: 'PAYMENT_SUCCESS',
        message: 'Payment completed successfully',
      });

      // Clear cart
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5 px-4">
                {/* Success Icon */}
                <div className="mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" 
                       style={{ width: '100px', height: '100px' }}>
                    <i className="fa fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                </div>

                {/* Success Message */}
                <h2 className="mb-3 text-success fw-bold">Payment Successful!</h2>
                <p className="text-muted mb-4 fs-5">
                  Thank you for your purchase. Your order has been confirmed and will be processed shortly.
                </p>

                {/* Order Details */}
                {orderId && (
                  <div className="alert alert-light border mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Order ID:</span>
                      <strong className="text-dark">{orderId}</strong>
                    </div>
                    {transactionId && (
                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                        <span className="text-muted">Transaction ID:</span>
                        <strong className="text-dark small">{transactionId}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div className="alert alert-info mb-4">
                  <i className="fa fa-info-circle me-2"></i>
                  <small>
                    You will receive an email confirmation shortly. You can track your order status in "My Orders".
                  </small>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <Link href="/my-orders" className="btn btn-primary btn-lg">
                    <i className="fa fa-shopping-bag me-2"></i>
                    View My Orders
                  </Link>
                  <Link href="/" className="btn btn-outline-secondary btn-lg">
                    <i className="fa fa-home me-2"></i>
                    Continue Shopping
                  </Link>
                </div>

                {/* Auto Redirect Notice */}
                {!loading && countdown > 0 && (
                  <p className="text-muted small mt-4 mb-0">
                    <i className="fa fa-clock me-1"></i>
                    Redirecting to orders page in <strong>{countdown}</strong> seconds...
                  </p>
                )}
              </div>
            </div>

            {/* Additional Help Section */}
            <div className="card mt-4 border-0 bg-light">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fa fa-question-circle me-2"></i>
                  Need Help?
                </h5>
                <p className="card-text small text-muted mb-0">
                  If you have any questions about your order, please contact our customer support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
