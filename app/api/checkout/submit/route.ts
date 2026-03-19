/**
 * Next.js API Route: /api/checkout/submit
 * Proxies checkout/order placement requests to the backend API
 */

import { NextRequest, NextResponse } from 'next/server';
import environment from '@/config/environment';

export interface PlaceOrderResponse {
  orderId?: string;
  id?: number;
  orderID?: string;
  order_id?: string;
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

    // Add userId to headers
    if (userId) {
      headers['userId'] = userId.toString();
    }

    // Try multiple endpoint patterns (prioritize Checkout endpoints)
    const endpoints = [
      // Checkout endpoints (capital C) - prioritize these
      { url: `${backendUrl}/Checkout/Submit`, method: 'POST' as const },
      { url: `${backendUrl}/Checkout/PlaceOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Checkout/CreateOrder`, method: 'POST' as const },
      // Order endpoints (capital O)
      { url: `${backendUrl}/Order/PlaceOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Order/PlaceOrder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/Order/CreateOrder`, method: 'POST' as const },
      { url: `${backendUrl}/Order/CreateOrder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/Order/Create`, method: 'POST' as const },
      { url: `${backendUrl}/Order/Submit`, method: 'POST' as const },
      // checkout endpoints (lowercase)
      { url: `${backendUrl}/checkout/submit`, method: 'POST' as const },
      { url: `${backendUrl}/checkout/placeorder`, method: 'POST' as const },
      { url: `${backendUrl}/checkout/createorder`, method: 'POST' as const },
      // order endpoints (lowercase)
      { url: `${backendUrl}/order/placeorder`, method: 'POST' as const },
      { url: `${backendUrl}/order/placeorder/${userId}`, method: 'POST' as const },
      { url: `${backendUrl}/order/createorder`, method: 'POST' as const },
      { url: `${backendUrl}/order/create`, method: 'POST' as const },
      { url: `${backendUrl}/order/submit`, method: 'POST' as const },
    ];

    let lastError: any = null;
    const triedEndpoints: string[] = [];

    // Prepare request body with "request" wrapper
    const requestBodyWithRequest = {
      request: body.request || body,
      ...(body.request ? {} : body),
    };

    // Also prepare direct format (without wrapper)
    const requestBodyDirect = body.request || body;

    // Try each endpoint until one succeeds
    for (const endpoint of endpoints) {
      try {
        triedEndpoints.push(`${endpoint.method} ${endpoint.url}`);
        
        // Try with request wrapper first
        let response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers,
          body: JSON.stringify(requestBodyWithRequest),
          credentials: 'omit',
          cache: 'no-cache',
        });

        // If that fails with 400, try direct format
        if (!response.ok && response.status === 400) {
          response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(requestBodyDirect),
            credentials: 'omit',
            cache: 'no-cache',
          });
        }

        if (response.ok) {
          try {
            const data: PlaceOrderResponse = await response.json();
            return NextResponse.json(data, { status: 200 });
          } catch (parseError) {
            // If response is not JSON, return success with empty body
            if (response.redirected) {
              return NextResponse.json({ redirectUrl: response.url }, { status: 200 });
            }
            return NextResponse.json({ success: true }, { status: 200 });
          }
        } else if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: 'Unauthorized. Please log in.' },
            { status: response.status }
          );
        } else if (response.status !== 404 && response.status !== 405) {
          // For non-404/405 errors, try next endpoint
          const errorText = await response.text().catch(() => '');
          lastError = new Error(`Checkout failed: ${response.status} ${response.statusText}. ${errorText}`);
          continue;
        }
        // For 404/405, continue to next endpoint
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }

    // If all endpoints failed, return detailed error
    const errorMessage = lastError?.message || 'Failed to process checkout: All endpoints failed';
    const triedEndpointsStr = triedEndpoints.length > 0 
      ? `\n\nTried endpoints:\n${triedEndpoints.map(e => `  - ${e}`).join('\n')}`
      : '';
    
    return NextResponse.json(
      { 
        error: `${errorMessage}${triedEndpointsStr}\n\nPlease verify that the backend API has one of these endpoints implemented.` 
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in /api/checkout/submit:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
