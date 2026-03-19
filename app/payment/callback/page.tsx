/**
 * Payment Callback Page
 * Handles PhonePe payment callback and redirects
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PhonePeService from '@/services/PhonePeService';
import AuthService from '@/services/AuthService';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/account/login?returnUrl=/payment/callback');
      return;
    }
    processPaymentCallback();
  }, [router, searchParams]);

  const processPaymentCallback = async () => {
    try {
      // Get parameters from URL
      const orderIdParam = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('orderID');
      const transactionId = searchParams.get('transactionId') || searchParams.get('transaction_id') || searchParams.get('txnId');
      const statusParam = searchParams.get('status') || searchParams.get('payment_status');
      const code = searchParams.get('code');
      const messageParam = searchParams.get('message') || searchParams.get('msg');
      const responseCode = searchParams.get('responseCode') || searchParams.get('response_code');

      // Extract orderId from URL if not in params
      let extractedOrderId = orderIdParam;
      if (!extractedOrderId) {
        // Try to extract from URL path or other sources
        const urlParts = window.location.pathname.split('/');
        const orderIndex = urlParts.findIndex(part => part.toLowerCase().includes('order'));
        if (orderIndex >= 0 && orderIndex < urlParts.length - 1) {
          extractedOrderId = urlParts[orderIndex + 1];
        }
      }

      setOrderId(extractedOrderId);

      // Quick check: If URL params indicate success, redirect immediately
      if (extractedOrderId && (
        statusParam?.toLowerCase() === 'success' || 
        code === 'PAYMENT_SUCCESS' || 
        responseCode === 'PAYMENT_SUCCESS' ||
        code === 'SUCCESS'
      )) {
        // Immediately redirect to success page
        const successUrl = `/payment/success?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
        router.push(successUrl);
        return;
      }

      // Quick check: If URL params indicate failure, redirect immediately
      if (extractedOrderId && (
        statusParam?.toLowerCase() === 'failed' || 
        statusParam?.toLowerCase() === 'cancelled' || 
        code === 'PAYMENT_FAILED' ||
        code === 'PAYMENT_CANCELLED' ||
        responseCode === 'PAYMENT_FAILED'
      )) {
        // Immediately redirect to failure page
        const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}&code=${code || 'PAYMENT_FAILED'}&message=${encodeURIComponent(messageParam || 'Payment failed')}`;
        router.push(failureUrl);
        return;
      }

      // Prepare callback data (all URL params so backend can update payment status)
      const allParams = Object.fromEntries(searchParams.entries());
      const callbackData: any = {
        orderId: extractedOrderId,
        transactionId,
        status: statusParam,
        code,
        message: messageParam,
        ...allParams,
      };

      if (extractedOrderId) {
        // Notify backend so attached API can update order/payment status in DB
        await PhonePeService.updatePaymentStatus({
          orderId: extractedOrderId,
          status: statusParam ?? (code === 'PAYMENT_SUCCESS' ? 'Success' : code === 'PAYMENT_FAILED' ? 'Failed' : undefined),
          transactionId: transactionId ?? undefined,
          code: code ?? undefined,
          message: messageParam ?? undefined,
          ...allParams,
        });
        await PhonePeService.handleCallback(callbackData);

        // Verify payment status (Next.js + API)
        const verifyResult = await PhonePeService.verifyPayment(extractedOrderId, transactionId || undefined);
        
        if (verifyResult.success) {
          const paymentStatus = verifyResult.status?.toLowerCase();
          
          if (paymentStatus === 'success' || paymentStatus === 'paid' || paymentStatus === 'completed') {
            // Clear cart
            window.dispatchEvent(new Event('cartUpdated'));
            
            // Immediately redirect to success page
            const successUrl = `/payment/success?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
            router.push(successUrl);
            return;
          } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
            // Immediately redirect to failure page
            const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}&code=PAYMENT_FAILED`;
            router.push(failureUrl);
            return;
          } else {
            // Try to handle callback
            const callbackResult = await PhonePeService.handleCallback(callbackData);
            
            if (callbackResult.success) {
              const resultStatus = callbackResult.status?.toLowerCase();
              if (resultStatus === 'success' || resultStatus === 'paid' || resultStatus === 'completed') {
                window.dispatchEvent(new Event('cartUpdated'));
                const successUrl = `/payment/success?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
                router.push(successUrl);
                return;
              } else {
                const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}&code=PAYMENT_FAILED`;
                router.push(failureUrl);
                return;
              }
            } else {
              setStatus('failed');
              setMessage(callbackResult.error || 'Failed to process payment callback.');
            }
          }
        } else {
          // If verification fails, try callback
          const callbackResult = await PhonePeService.handleCallback(callbackData);
          
          if (callbackResult.success) {
            const resultStatus = callbackResult.status?.toLowerCase();
            if (resultStatus === 'success' || resultStatus === 'paid' || resultStatus === 'completed') {
              window.dispatchEvent(new Event('cartUpdated'));
              const successUrl = `/payment/success?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
              router.push(successUrl);
              return;
            } else {
              const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
              router.push(failureUrl);
              return;
            }
          } else {
            // Check status from URL params
            if (statusParam?.toLowerCase() === 'success' || code === 'PAYMENT_SUCCESS') {
              window.dispatchEvent(new Event('cartUpdated'));
              const successUrl = `/payment/success?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
              router.push(successUrl);
              return;
            } else if (statusParam?.toLowerCase() === 'failed' || statusParam?.toLowerCase() === 'cancelled' || code === 'PAYMENT_FAILED') {
              const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}&code=${code || 'PAYMENT_FAILED'}&message=${encodeURIComponent(messageParam || 'Payment failed')}`;
              router.push(failureUrl);
              return;
            } else {
              const failureUrl = `/payment/failure?orderId=${extractedOrderId}${transactionId ? `&transactionId=${transactionId}` : ''}`;
              router.push(failureUrl);
              return;
            }
          }
        }
      } else {
        // No order ID found, redirect to failure page
        router.push('/payment/failure?message=' + encodeURIComponent('Order ID not found'));
        return;
      }
    } catch (error: any) {
      console.error('Error processing payment callback:', error);
      setStatus('failed');
      setMessage(error?.message || 'An error occurred while processing your payment. Please check your orders.');
    }
  };

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                {status === 'loading' && (
                  <>
                    <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4 className="mb-3">Processing Payment</h4>
                    <p className="text-muted">{message}</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="mb-4">
                      <i className="fa fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="mb-3 text-success">Payment Successful!</h4>
                    <p className="text-muted mb-4">{message}</p>
                    {orderId && (
                      <p className="small text-muted mb-4">
                        Order ID: <strong>{orderId}</strong>
                      </p>
                    )}
                    <p className="text-muted small mb-4">Redirecting to your orders...</p>
                    <div className="d-flex justify-content-center gap-3">
                      <Link href="/my-orders" className="btn btn-primary">
                        <i className="fa fa-shopping-bag me-2"></i>View Orders
                      </Link>
                      <Link href="/" className="btn btn-outline-secondary">
                        <i className="fa fa-home me-2"></i>Continue Shopping
                      </Link>
                    </div>
                  </>
                )}

                {status === 'failed' && (
                  <>
                    <div className="mb-4">
                      <i className="fa fa-times-circle text-danger" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="mb-3 text-danger">Payment Failed</h4>
                    <p className="text-muted mb-4">{message}</p>
                    {orderId && (
                      <p className="small text-muted mb-4">
                        Order ID: <strong>{orderId}</strong>
                      </p>
                    )}
                    <div className="d-flex justify-content-center gap-3">
                      <Link href="/checkout" className="btn btn-primary">
                        <i className="fa fa-redo me-2"></i>Try Again
                      </Link>
                      <Link href="/my-orders" className="btn btn-outline-secondary">
                        <i className="fa fa-list me-2"></i>Check Orders
                      </Link>
                      <Link href="/" className="btn btn-outline-secondary">
                        <i className="fa fa-home me-2"></i>Home
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
