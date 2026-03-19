/**
 * Next.js API Route: /api/order/placeorder
 * Proxies order placement requests to backend API
 */

import { NextRequest, NextResponse } from 'next/server';
import environment from '@/config/environment';

export interface PlaceOrderRequest {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  phone: string;
  country?: string;
  paymentMethod?: string;
  userId: number;
  totalAmount: number;
  items?: any[];
  cartItems?: any[];
  orderItems?: any[];
}

export interface PlaceOrderResponse {
  orderId?: string;
  id?: number;
  totalAmount?: number;
  status?: string;
  paymentUrl?: string;
  redirectUrl?: string;
  url?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const backendUrl = environment.api.baseUrl;
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('userid');
    
    // Parse request body
    const body = await request.json();
    
    // Extract userId from body or header
    const userId = body.userId || body.request?.userId || (userIdHeader ? parseInt(userIdHeader) : null);
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Add userId to headers if available
    if (userId) {
      headers['userId'] = userId.toString();
    }

    // Try multiple endpoint patterns (try most common first)
    const endpoints = [
      // Order endpoints (capital O)
      { url: `${backendUrl}/Order/PlaceOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Order/PlaceOrder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/Order/CreateOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Order/CreateOrder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/Order/Create`, method: 'POST' as const },
      { url: `${backendUrl}/Order/Submit`, method: 'POST' as const },
      // Checkout endpoints (capital C)
      { url: `${backendUrl}/Checkout/Submit`, method: 'POST' as const },
      { url: `${backendUrl}/Checkout/PlaceOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Checkout/CreateOrder`, method: 'POST' as const },
      // order endpoints (lowercase)
      { url: `${backendUrl}/order/placeorder`, method: 'POST' as const },
      { url: `${backendUrl}/order/placeorder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/order/createorder`, method: 'POST' as const },
      { url: `${backendUrl}/order/create`, method: 'POST' as const },
      { url: `${backendUrl}/order/submit`, method: 'POST' as const },
      // checkout endpoints (lowercase)
      { url: `${backendUrl}/checkout/submit`, method: 'POST' as const },
      { url: `${backendUrl}/checkout/placeorder`, method: 'POST' as const },
      { url: `${backendUrl}/checkout/createorder`, method: 'POST' as const },
    ];

    let lastError: any = null;
    const triedEndpoints: string[] = [];

    // Prepare request body with "request" wrapper
    const requestBodyWithRequest = {
      request: {
        email: body.email || body.request?.email,
        firstName: body.firstName || body.request?.firstName,
        lastName: body.lastName || body.request?.lastName,
        address: body.address || body.request?.address,
        city: body.city || body.request?.city,
        pincode: body.pincode || body.request?.pincode,
        state: body.state || body.request?.state,
        phone: body.phone || body.request?.phone,
        country: body.country || body.request?.country || '1',
        paymentMethod: body.paymentMethod || body.request?.paymentMethod || 'PhonePe',
        userId: userId,
        totalAmount: body.totalAmount || body.request?.totalAmount,
        items: body.items || body.request?.items || body.cartItems || body.orderItems,
        cartItems: body.cartItems || body.request?.cartItems || body.items || body.orderItems,
        orderItems: body.orderItems || body.request?.orderItems || body.items || body.cartItems,
      },
      items: body.items || body.request?.items || body.cartItems || body.orderItems,
      cartItems: body.cartItems || body.request?.cartItems || body.items || body.orderItems,
      orderItems: body.orderItems || body.request?.orderItems || body.items || body.cartItems,
      totalAmount: body.totalAmount || body.request?.totalAmount,
      userId: userId,
    };

    // Also prepare direct format (no wrapper)
    const directRequestBody = {
      email: body.email || body.request?.email,
      firstName: body.firstName || body.request?.firstName,
      lastName: body.lastName || body.request?.lastName,
      address: body.address || body.request?.address,
      city: body.city || body.request?.city,
      pincode: body.pincode || body.request?.pincode,
      state: body.state || body.request?.state,
      phone: body.phone || body.request?.phone,
      country: body.country || body.request?.country || '1',
      paymentMethod: body.paymentMethod || body.request?.paymentMethod || 'PhonePe',
      userId: userId,
      totalAmount: body.totalAmount || body.request?.totalAmount,
      items: body.items || body.request?.items || body.cartItems || body.orderItems,
      cartItems: body.cartItems || body.request?.cartItems || body.items || body.orderItems,
      orderItems: body.orderItems || body.request?.orderItems || body.items || body.cartItems,
    };

    for (const endpoint of endpoints) {
      try {
        triedEndpoints.push(`${endpoint.method} ${endpoint.url}`);
        
        // Try with "request" wrapper first
        let response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers,
          body: JSON.stringify(requestBodyWithRequest),
        });

        // If that fails with 400, try direct format
        if (!response.ok && response.status === 400) {
          response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(directRequestBody),
          });
        }

        if (response.ok) {
          const data: PlaceOrderResponse = await response.json();
          // Stop immediately after first success to prevent duplicate attempts
          return NextResponse.json(data, { status: 200 });
        } else if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: 'Please log in to complete checkout' },
            { status: response.status }
          );
        } else if (response.status !== 404 && response.status !== 405) {
          // For non-404 errors, stop trying other endpoints
          const errorText = await response.text().catch(() => '');
          lastError = new Error(`Backend returned ${response.status}: ${response.statusText}. ${errorText}`);
          // Don't continue if we got a meaningful error (not 404/405)
          if (response.status >= 400 && response.status < 500 && response.status !== 404 && response.status !== 405) {
            break;
          }
        }
      } catch (error: any) {
        // For network errors, continue trying other endpoints
        // For other errors, log and continue
        if (!error?.message?.includes('fetch') && !error?.message?.includes('network')) {
          lastError = error;
        } else {
          lastError = error;
          continue;
        }
      }
    }

    // If all endpoints failed, return detailed error
    const errorMessage = lastError?.message || 'Failed to place order: All endpoints failed';
    const triedEndpointsStr = triedEndpoints.length > 0 
      ? `\n\nTried endpoints:\n${triedEndpoints.map(e => `  - ${e}`).join('\n')}`
      : '';
    
    return NextResponse.json(
      {
        error: `${errorMessage}${triedEndpointsStr}\n\nPlease verify that the backend API has one of these endpoints implemented.`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[API Route] Error in placeorder:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
