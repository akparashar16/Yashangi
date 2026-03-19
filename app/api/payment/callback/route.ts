/**
 * Next.js API Route: /api/payment/callback
 * Handles PhonePe payment callbacks server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import environment from '@/config/environment';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = environment.api.baseUrl;
    
    // Get callback data from request body
    const callbackData = await request.json().catch(() => ({}));
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie');
    
    // Prepare headers for backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    // Try multiple endpoint patterns
    const endpoints = [
      `${backendUrl}/Payment/Callback`,
      `${backendUrl}/payment/callback`,
      `${backendUrl}/Payment/PhonePeCallback`,
      `${backendUrl}/payment/phonepecallback`,
      `${backendUrl}/Payment/HandleCallback`,
      `${backendUrl}/payment/handlecallback`,
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(callbackData),
        });

        if (response.ok) {
          try {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              orderId: data.orderId || callbackData.orderId,
              status: data.status || data.paymentStatus || 'Success',
              message: data.message || 'Payment processed successfully',
            });
          } catch {
            return NextResponse.json({
              success: true,
              orderId: callbackData.orderId,
              status: 'Success',
            });
          }
        } else if (response.status !== 404 && response.status !== 405) {
          const errorText = await response.text().catch(() => '');
          lastError = new Error(`Payment callback failed: ${response.status} ${response.statusText}. ${errorText}`);
        }
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }

    // If all endpoints failed, return error
    return NextResponse.json(
      {
        success: false,
        error: lastError?.message || 'Failed to process payment callback',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error processing payment callback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests (for redirect-based callbacks)
  try {
    const backendUrl = environment.api.baseUrl;
    const searchParams = request.nextUrl.searchParams;
    
    // Extract callback parameters from URL
    const callbackData: any = {};
    searchParams.forEach((value, key) => {
      callbackData[key] = value;
    });

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie');
    
    // Prepare headers for backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    // Try multiple endpoint patterns
    const endpoints = [
      `${backendUrl}/Payment/Callback`,
      `${backendUrl}/payment/callback`,
      `${backendUrl}/Payment/PhonePeCallback`,
      `${backendUrl}/payment/phonepecallback`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(callbackData),
        });

        if (response.ok) {
          try {
            const data = await response.json();
            // Redirect to frontend callback page with status
            const redirectUrl = new URL('/payment/callback', request.url);
            redirectUrl.searchParams.set('orderId', data.orderId || callbackData.orderId || '');
            redirectUrl.searchParams.set('status', data.status || 'success');
            return NextResponse.redirect(redirectUrl);
          } catch {
            // Redirect anyway
            const redirectUrl = new URL('/payment/callback', request.url);
            redirectUrl.searchParams.set('orderId', callbackData.orderId || '');
            redirectUrl.searchParams.set('status', 'success');
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch (error) {
        continue;
      }
    }

    // If all endpoints failed, redirect to callback page with error
    const redirectUrl = new URL('/payment/callback', request.url);
    redirectUrl.searchParams.set('status', 'failed');
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error processing payment callback:', error);
    const redirectUrl = new URL('/payment/callback', request.url);
    redirectUrl.searchParams.set('status', 'failed');
    return NextResponse.redirect(redirectUrl);
  }
}
