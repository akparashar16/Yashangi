/**
 * Payment Failure Page
 * Displays failure message when payment is unsuccessful
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PhonePeService from '@/services/PhonePeService';
import AuthService from '@/services/AuthService';

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/account/login?returnUrl=/payment/failure');
      return;
    }

    // Extract parameters from URL
    const orderIdParam = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('orderID');
    const transactionIdParam = searchParams.get('transactionId') || searchParams.get('transaction_id') || searchParams.get('txnId');
    const messageParam = searchParams.get('message') || searchParams.get('msg') || searchParams.get('error');
    const code = searchParams.get('code');

    setOrderId(orderIdParam);
    setTransactionId(transactionIdParam);

    // Set error message
    if (messageParam) {
      setErrorMessage(messageParam);
    } else if (code === 'PAYMENT_FAILED' || code === 'PAYMENT_CANCELLED') {
      setErrorMessage(code === 'PAYMENT_CANCELLED' 
        ? 'Payment was cancelled. Please try again to complete your order.'
        : 'Payment failed. Please check your payment details and try again.');
    } else {
      setErrorMessage('Payment could not be processed. Please try again or use a different payment method.');
    }

    // Update payment status on backend
    if (orderIdParam) {
      updatePaymentStatus(orderIdParam, transactionIdParam || undefined, code || 'PAYMENT_FAILED');
    } else {
      setLoading(false);
    }
  }, [router, searchParams]);

  const updatePaymentStatus = async (orderId: string, transactionId?: string, code?: string) => {
    try {
      // Notify backend about failed payment
      await PhonePeService.updatePaymentStatus({
        orderId,
        status: 'Failed',
        transactionId,
        code: code || 'PAYMENT_FAILED',
        message: errorMessage || 'Payment failed',
      });
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
                {/* Failure Icon */}
                <div className="mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" 
                       style={{ width: '100px', height: '100px' }}>
                    <i className="fa fa-times-circle text-danger" style={{ fontSize: '4rem' }}></i>
                  </div>
                </div>

                {/* Failure Message */}
                <h2 className="mb-3 text-danger fw-bold">Payment Failed</h2>
                <p className="text-muted mb-4 fs-5">
                  {errorMessage || 'We were unable to process your payment. Please try again.'}
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

                {/* Common Reasons */}
                <div className="alert alert-warning mb-4 text-start">
                  <h6 className="alert-heading mb-2">
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    Common reasons for payment failure:
                  </h6>
                  <ul className="mb-0 small">
                    <li>Insufficient funds in your account</li>
                    <li>Incorrect card details or expired card</li>
                    <li>Network connectivity issues</li>
                    <li>Payment gateway temporarily unavailable</li>
                    <li>Transaction declined by your bank</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <Link href="/checkout" className="btn btn-primary btn-lg">
                    <i className="fa fa-redo me-2"></i>
                    Try Again
                  </Link>
                  <Link href="/my-orders" className="btn btn-outline-secondary btn-lg">
                    <i className="fa fa-list me-2"></i>
                    Check Orders
                  </Link>
                  <Link href="/" className="btn btn-outline-secondary btn-lg">
                    <i className="fa fa-home me-2"></i>
                    Home
                  </Link>
                </div>

                {/* Support Information */}
                <div className="mt-4 pt-4 border-top">
                  <p className="text-muted small mb-2">
                    <i className="fa fa-info-circle me-1"></i>
                    Your order has been saved. You can retry payment from "My Orders".
                  </p>
                  <p className="text-muted small mb-0">
                    Need help? Contact our support team for assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="card mt-4 border-0 bg-light">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fa fa-life-ring me-2"></i>
                  Payment Support
                </h5>
                <p className="card-text small text-muted mb-2">
                  If you continue to experience payment issues, please:
                </p>
                <ul className="small text-muted mb-0">
                  <li>Verify your payment method details</li>
                  <li>Check with your bank if the transaction was blocked</li>
                  <li>Try using a different payment method</li>
                  <li>Contact customer support with your Order ID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
