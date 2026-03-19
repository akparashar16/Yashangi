/**
 * Next.js API Route: /api/cart/getcartdata
 * Fetches cart data from backend API and aggregates it into CartDataResponse format
 */

import { NextRequest, NextResponse } from 'next/server';
import environment from '@/config/environment';
import { CartItem, CartDataResponse } from '@/models/Cart';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = environment.api.baseUrl;
    
    // Get auth token from request headers or cookies
    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie');
    
    // Try to get user ID from query params or try to extract from session
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward cookies if present (for session-based auth)
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    // Try multiple endpoint patterns to get cart data
    const endpoints = [
      // Try /Cart/GetCart first (capital C)
      { url: `${backendUrl}/Cart/GetCart`, method: 'POST' as const },
      { url: `${backendUrl}/Cart/GetCart`, method: 'GET' as const },
      // Try /Cart
      { url: `${backendUrl}/Cart`, method: 'POST' as const },
      { url: `${backendUrl}/Cart`, method: 'GET' as const },
      // Try with userId if available
      ...(userId ? [
        { url: `${backendUrl}/Cart/${userId}`, method: 'GET' as const },
        { url: `${backendUrl}/cart/${userId}`, method: 'GET' as const },
      ] : []),
      // Fallback to lowercase
      { url: `${backendUrl}/cart/GetCart`, method: 'POST' as const },
      { url: `${backendUrl}/cart/GetCart`, method: 'GET' as const },
    ];

    let lastError: any = null;
    let cartItems: CartItem[] = [];

    for (const endpoint of endpoints) {
      try {
        const fetchOptions: RequestInit = {
          method: endpoint.method,
          headers,
          cache: 'no-cache',
        };

        // Add body for POST requests
        if (endpoint.method === 'POST') {
          fetchOptions.body = JSON.stringify({});
        }

        const response = await fetch(endpoint.url, fetchOptions);

        if (response.ok) {
          const data = await response.json();
          
          // Handle different response formats
          if (Array.isArray(data)) {
            // If response is an array of cart items
            cartItems = data;
          } else if (data.items || data.cartItems) {
            // If response has items property
            cartItems = data.items || data.cartItems || [];
          } else if (data.id && data.productId) {
            // If response is a single cart item, wrap it in array
            cartItems = [data];
          } else {
            // Try to extract items from nested structure
            cartItems = data.data?.items || data.data?.cartItems || [];
          }

          // Normalize image URLs - map imagePath to imageUrl if needed
          cartItems = cartItems.map((item: any) => {
            // If imageUrl doesn't exist but imagePath does, use imagePath
            if (!item.imageUrl && item.imagePath) {
              item.imageUrl = item.imagePath;
            }
            // If image is nested in product object, extract it
            if (!item.imageUrl && item.product?.imageUrl) {
              item.imageUrl = item.product.imageUrl;
            }
            if (!item.imageUrl && item.product?.imagePath) {
              item.imageUrl = item.product.imagePath;
            }
            // If image is nested in primaryImage
            if (!item.imageUrl && item.product?.primaryImage?.imagePath) {
              item.imageUrl = item.product.primaryImage.imagePath;
            }
            if (!item.imageUrl && item.primaryImage?.imagePath) {
              item.imageUrl = item.primaryImage.imagePath;
            }
            return item;
          });

          // Calculate totals
          const total = cartItems.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice || 0) * (item.quantity || 0)), 0);
          const itemCount = cartItems.length;

          // Return formatted response
          const cartData: CartDataResponse = {
            success: true,
            items: cartItems,
            total: total,
            itemCount: itemCount,
            message: 'Cart loaded successfully',
          };

          return NextResponse.json(cartData, { status: 200 });
        } else if (response.status === 401 || response.status === 403) {
          // Unauthorized - user not logged in
          return NextResponse.json(
            {
              success: false,
              items: [],
              total: 0,
              itemCount: 0,
              message: 'Please log in to view your cart',
            },
            { status: 200 } // Return 200 with empty cart, not error
          );
        } else if (response.status !== 404 && response.status !== 405) {
          lastError = new Error(`Backend returned ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }

    // If all endpoints failed, return empty cart (not an error)
    console.warn('[API Route] All endpoints failed for getcartdata, returning empty cart:', lastError);
    return NextResponse.json(
      {
        success: true,
        items: [],
        total: 0,
        itemCount: 0,
        message: 'Cart is empty',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API Route] Error in getcartdata:', error);
    return NextResponse.json(
      {
        success: false,
        items: [],
        total: 0,
        itemCount: 0,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Also support POST method
  return GET(request);
}
