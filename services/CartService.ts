/**
 * Cart Service
 * Handles all cart-related business logic and API calls matching ECommerce.Web
 */

import { CartItem, AddToCartRequest, UpdateCartItemRequest, RemoveCartItemRequest, CartDataResponse } from '@/models/Cart';
import environment from '@/config/environment';
import AuthService from '@/services/AuthService';

class CartService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Get cart items for current user
   */
  async getCartByUserId(userId: number): Promise<CartItem[]> {
    try {
     
      const token = this.getToken();
      
      // Try multiple endpoint patterns with 'omit' credentials to avoid CORS issues
      const endpoints = [
        // GET requests first
        { url: `${this.baseUrl}/Cart/getcartdata?userId=${userId}`, method: 'GET' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const fetchOptions: RequestInit = {
            method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
              'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
              ...(userId && { 'userId': userId.toString() }),
            },
            
            cache: 'no-cache',
          };

          const response = await fetch(endpoint.url, fetchOptions);

          if (response.ok) {
            const data = await response.json();
            // Handle different response formats
            if (Array.isArray(data)) {
              return data;
            } else if (data.items || data.cartItems) {
              return data.items || data.cartItems || [];
            } else {
              return [];
            }
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint
            lastError = new Error(`Method ${endpoint.method} not allowed`);
            continue;
          } else if (response.status === 401 || response.status === 403) {
            // Unauthorized - return empty array
            return [];
          } else {
            lastError = new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
      }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin');
          
          if (isCorsError) {
            lastError = error;
            continue;
          }
          
          throw error;
        }
      }

      // If all endpoints failed, return empty array instead of throwing (graceful degradation)
      console.warn('[CartService] All endpoints failed for getCartByUserId, returning empty array:', lastError);
      return [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Return empty array instead of throwing (graceful degradation)
      return [];
    }
  }

  /**
   * Add item to cart
   * Tries multiple endpoint patterns to match the backend API
   * Accepts encrypted ID (string) or numeric ID
   */
  async addToCart(productId: number | string, size: string = '', quantity: number = 1): Promise<void> {
    // Keep productId as-is (could be encrypted string or numeric)
    // The backend will handle decryption if it's an encrypted string
    const productIdValue = productId;
    
    // Ensure size is always a string (default to empty string if undefined/null)
    const sizeValue = size || '';
    
    // Check if user is authenticated
    const isAuthenticated = AuthService.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your cart.');
    }
    
    // Log current user for debugging
    const currentUser = AuthService.getCurrentUser();
    const userId = AuthService.getCurrentUserId();
    const token = this.getToken();
    console.log('[CartService] Current user:', currentUser ? `${currentUser.firstName} (ID: ${currentUser.userId})` : 'Not logged in');
    console.log('[CartService] User ID:', userId);
    console.log('[CartService] Auth token available:', token ? 'Yes' : 'No');
    console.log('[CartService] API Base URL:', this.baseUrl);
    console.log('[CartService] Adding product to cart:', { productId: productIdValue, size: sizeValue, quantity });
    
    // Determine if productId is encrypted (string) or numeric
    const isEncryptedId = typeof productIdValue === 'string';
    
    // Prepare request body - use productIdString for encrypted IDs, productId for numeric
    // Use camelCase to match JSON naming policy
    const requestBody: any = {
      size: sizeValue,
      quantity: quantity,
    };
    
    if (isEncryptedId) {
      requestBody.productIdString = productIdValue;
      requestBody.productId = 0; // Backend will use ProductIdString if provided
    } else {
      requestBody.productId = productIdValue;
    }
    
    // Try POST with JSON body (backend expects POST /api/Cart/add with JSON body)
    const endpoints = [
      {
        url: `${this.baseUrl}/Cart/add`,
        method: 'POST' as const,
        credentials: 'omit' as const,
      },
      {
        url: `${this.baseUrl}/cart/add`,
        method: 'POST' as const,
        credentials: 'omit' as const,
      },
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`[CartService] Trying to add to cart: ${endpoint.method} ${endpoint.url}`);
        console.log(`[CartService] Request body:`, JSON.stringify(requestBody, null, 2));
        console.log(`[CartService] Is encrypted ID: ${isEncryptedId}, Product ID value: ${productIdValue}`);
        
        // Prepare headers with Authorization token and userId
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(userId && { 'userId': userId.toString() }),
        };
        
        console.log(`[CartService] Request headers:`, { ...headers, Authorization: token ? 'Bearer ***' : 'none' });
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers,
          body: JSON.stringify(requestBody),
          mode: 'cors',
          credentials: endpoint.credentials,
          cache: 'no-cache',
        });

        console.log(`[CartService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          console.log('[CartService] Successfully added to cart. Response:', responseData);
          return; // Success, exit early
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CartService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CartService] Parsed error JSON:', errorJson);
              errorDetails = errorJson.message || errorJson.title || errorText;
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CartService] Could not read error response:', e);
          }

          // For 401/403 errors, provide specific message
          if (response.status === 401 || response.status === 403) {
            lastError = new Error('Please log in to add items to your cart.');
          } else if (response.status === 400) {
            lastError = new Error(errorDetails || 'Invalid request. Please check the product details.');
          } else if (response.status === 404) {
            // Product not found - provide more details
            console.error(`[CartService] Product not found. Request was:`, {
              productId: productIdValue,
              isEncryptedId,
              requestBody,
            });
            lastError = new Error(errorDetails || `Product not found. Please check the product ID: ${productIdValue}`);
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint with different method
            console.warn(`[CartService] 405 Method Not Allowed for ${endpoint.method} ${endpoint.url} - trying next endpoint...`);
            lastError = new Error(`Method ${endpoint.method} not allowed. Trying alternative method...`);
            // Continue to next endpoint
            if (endpoint === endpoints[endpoints.length - 1]) {
              throw new Error('All HTTP methods failed. The cart endpoint may not be configured correctly.');
            }
            continue;
          } else {
            lastError = new Error(
              errorDetails || `Failed to add item to cart: ${response.status} ${response.statusText}`
            );
          }
          
          // If it's the last endpoint and not a 405, throw the error
          if (response.status !== 405 && endpoint === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
      }
      } catch (error: any) {
        console.error(`[CartService] Error with endpoint ${endpoint.method} ${endpoint.url}:`, error);
        console.error(`[CartService] Error name: ${error.name}, message: ${error.message}`);
        console.error(`[CartService] Error stack:`, error.stack);
        lastError = error;
        
        // Check if it's a CORS error specifically
        const isCorsError = error.message?.includes('CORS') || 
                           error.message?.includes('Access-Control-Allow-Origin') ||
                           error.message?.includes('blocked by CORS policy');
        
        // If it's a CORS error, log and try next endpoint
        // (CORS errors can happen with different credential settings)
        if (isCorsError) {
          console.warn(`[CartService] CORS error for ${endpoint.method} ${endpoint.url}, trying next endpoint...`);
          lastError = error;
          continue;
        }
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message?.includes('Failed to fetch') || isCorsError || error.message?.includes('NetworkError')) {
          console.warn(`[CartService] Network error with ${endpoint.method} ${endpoint.url}, trying next endpoint...`);
          console.warn(`[CartService] Full error object:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
          });
          
          // Store the error but continue to next endpoint
          // Don't create the "Unable to connect" message yet - wait until all endpoints fail
          lastError = error;
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    if (lastError) {
      // Check if it's a network error
      const isNetworkError = lastError.name === 'TypeError' || 
                            lastError.message?.includes('Failed to fetch') || 
                            lastError.message?.includes('CORS') ||
                            lastError.message?.includes('NetworkError');
      
      if (isNetworkError) {
        // Since collection endpoints work, the API is accessible
        // The issue is likely specific to the cart/add endpoint
        throw new Error(
          `Unable to connect to the cart/add endpoint. ` +
          `The API server is accessible (other endpoints work), but the cart/add endpoint may have CORS or configuration issues. ` +
          `Please check: 1) Does the endpoint /cart/add exist? 2) Is CORS configured for POST/GET requests to /cart/add? ` +
          `3) Check the browser console for detailed error messages.`
        );
      }
      throw lastError;
    }
    throw new Error(
      `Failed to add item to cart. All endpoints failed. ` +
      `Please check: 1) Is the API server running at ${this.baseUrl}? ` +
      `2) Is CORS configured correctly? 3) Are you logged in? ` +
      `4) Check browser console for detailed error messages.`
    );
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(cartId: number, quantity: number): Promise<void> {
    try {
      const token = this.getToken();
      
      // Try multiple endpoint patterns with 'omit' credentials to avoid CORS issues
      const endpoints = [
        { url: `${this.baseUrl}/Cart/update`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/update`, method: 'POST' as const },
        { url: `${this.baseUrl}/Cart/Update`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/Update`, method: 'POST' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
    try {
      const formData = new FormData();
      formData.append('cartId', cartId.toString());
      formData.append('quantity', quantity.toString());

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Accept': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        body: formData,
            credentials: 'omit', // Use 'omit' to avoid CORS issues
            cache: 'no-cache',
      });

          if (response.ok) {
            return; // Success
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint
            lastError = new Error(`Method ${endpoint.method} not allowed`);
            continue;
          } else {
            lastError = new Error(`Failed to update cart item: ${response.status} ${response.statusText}`);
      }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin');
          
          if (isCorsError) {
            lastError = error;
            continue;
          }
          
          throw error;
        }
      }

      // If all endpoints failed, throw the last error
      throw lastError || new Error('Failed to update cart item: All endpoints failed');
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(cartId: number): Promise<void> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      // Backend API: [HttpDelete("{cartId}")] with userId in header
      // Try multiple endpoint patterns with DELETE method
      const endpoints = [
        { url: `${this.baseUrl}/Cart/${cartId}`, method: 'DELETE' as const },
        { url: `${this.baseUrl}/cart/${cartId}`, method: 'DELETE' as const },
        { url: `${this.baseUrl}/Cart/RemoveCartItem/${cartId}`, method: 'DELETE' as const },
        { url: `${this.baseUrl}/cart/RemoveCartItem/${cartId}`, method: 'DELETE' as const },
        // Fallback to POST methods if DELETE doesn't work
        { url: `${this.baseUrl}/Cart/${cartId}`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/${cartId}`, method: 'POST' as const },
        { url: `${this.baseUrl}/Cart/remove`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/remove`, method: 'POST' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
          };

          const fetchOptions: RequestInit = {
            method: endpoint.method,
            headers,
            credentials: 'omit', // Use 'omit' to avoid CORS issues
            cache: 'no-cache',
          };

          // For POST methods, include Content-Type and cartId in body
          if (endpoint.method === 'POST') {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify({ cartId });
          }
          // For DELETE methods, no body and no Content-Type header

          const response = await fetch(endpoint.url, fetchOptions);

          if (response.ok) {
            console.log(`[CartService] Successfully removed cart item ${cartId} using ${endpoint.method} ${endpoint.url}`);
            return; // Success
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint
            lastError = new Error(`Method ${endpoint.method} not allowed`);
            continue;
          } else if (response.status === 404) {
            // Not found - try next endpoint
            lastError = new Error(`Endpoint not found: ${endpoint.url}`);
            continue;
          } else {
            const errorText = await response.text().catch(() => '');
            lastError = new Error(`Failed to remove item from cart: ${response.status} ${response.statusText}. ${errorText}`);
      }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin');
          
          if (isCorsError) {
            lastError = error;
            continue;
          }
          
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, throw the last error
      throw lastError || new Error('Failed to remove item from cart: All endpoints failed');
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Get cart data for modal (AJAX)
   * Uses Next.js API route /api/cart/getcartdata which proxies to backend
   * @param userId Optional userId to pass to the API route
   */
  async getCartData(userId?: number): Promise<CartDataResponse> {
    try {
      const token = this.getToken();
      const currentUserId = userId || AuthService.getCurrentUserId();
      
      // Use Next.js API route to avoid CORS issues
      let apiUrl = '/cart/getcartdata';
      apiUrl = this.baseUrl+apiUrl;
      // Add userId as query parameter if available
      if (currentUserId) {
        apiUrl += `?userId=${currentUserId}`;
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(userId && { 'userId': userId.toString() }),
      };

      const response = await fetch(apiUrl, {
    
        method: 'GET',
        headers,
        cache: 'no-cache',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch cart data: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching cart data:', error);
      return { 
        success: false, 
        items: [], 
        total: 0, 
        itemCount: 0, 
        message: error.message || 'Failed to load cart' 
      };
    }
  }

  /**
   * Get cart count
   * Tries multiple endpoint patterns to match the backend API
   */
  async getCartCount(): Promise<number> {
    try {
      const token = this.getToken();
      
      // Try multiple endpoint patterns - prioritize GET first, then POST, use 'omit' credentials to avoid CORS issues
      const endpoints = [
        // GET requests with 'omit' first (most common for count endpoints)
        { url: `${this.baseUrl}/Cart/count`, method: 'GET' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/count`, method: 'GET' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/Cart/GetCount`, method: 'GET' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/GetCount`, method: 'GET' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/Cart/GetCartCount`, method: 'GET' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/GetCartCount`, method: 'GET' as const, credentials: 'omit' as const },
        // POST requests with 'omit' (fallback)
        { url: `${this.baseUrl}/Cart/count`, method: 'POST' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/count`, method: 'POST' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/Cart/GetCount`, method: 'POST' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/GetCount`, method: 'POST' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/Cart/GetCartCount`, method: 'POST' as const, credentials: 'omit' as const },
        { url: `${this.baseUrl}/cart/GetCartCount`, method: 'POST' as const, credentials: 'omit' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
          'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            
          };

          const fetchOptions: RequestInit = {
            method: endpoint.method,
            headers,
            credentials: endpoint.credentials,
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
            const count = data.count || data.itemCount || data.cartCount || 0;
            return typeof count === 'number' ? count : 0;
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint (don't log as error, just continue)
            lastError = new Error(`Method ${endpoint.method} not allowed for ${endpoint.url}`);
            continue;
          } else if (response.status === 401 || response.status === 403) {
            // Unauthorized - user not logged in, return 0
        return 0;
          } else {
            lastError = new Error(`Failed to fetch cart count: ${response.status} ${response.statusText}`);
          }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin') ||
                             error.message?.includes('blocked by CORS policy');
          
          
          
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, try to get count from cart data as fallback
      try {
        const cartData = await this.getCartData();
        if (cartData && cartData.itemCount !== undefined) {
          return cartData.itemCount;
        }
      } catch (fallbackError) {
        // Ignore fallback errors
      }

      // If all endpoints failed, return 0 (don't throw error for cart count)
      // Only log warning if it's not just 405 errors (which are expected when trying different methods)
      if (lastError && !lastError.message?.includes('Method') && !lastError.message?.includes('405')) {
        console.warn('[CartService] All endpoints failed for getCartCount, returning 0:', lastError);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching cart count:', error);
      return 0;
    }
  }

  /**
   * Update cart item via AJAX
   * Tries multiple endpoint patterns with 'omit' credentials to avoid CORS issues
   */
  async updateCartItemAjax(cartId: number, quantity: number): Promise<CartDataResponse> {
    try {
      const token = this.getToken();
      
      // Try multiple endpoint patterns with 'omit' credentials to avoid CORS issues
      const endpoints = [
        { url: `${this.baseUrl}/Cart/updatecartitemajax`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/updatecartitemajax`, method: 'POST' as const },
        { url: `${this.baseUrl}/Cart/UpdateCartItemAjax`, method: 'POST' as const },
        { url: `${this.baseUrl}/cart/UpdateCartItemAjax`, method: 'POST' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
    try {
      const formData = new FormData();
      formData.append('cartId', cartId.toString());
      formData.append('quantity', quantity.toString());

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Accept': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
              
            },
        body: formData,
            credentials: 'omit', // Use 'omit' to avoid CORS issues
            cache: 'no-cache',
      });

          if (response.ok) {
            return await response.json();
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint
            lastError = new Error(`Method ${endpoint.method} not allowed`);
            continue;
          } else {
            lastError = new Error(`Failed to update cart item: ${response.status} ${response.statusText}`);
      }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin');
          
          if (isCorsError) {
            lastError = error;
            continue;
          }
          
          throw error;
        }
      }

      // If all endpoints failed, return error response
      console.error('Error updating cart item:', lastError);
      return { success: false, items: [], total: 0, itemCount: 0, message: lastError?.message || 'Failed to update cart' };
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      return { success: false, items: [], total: 0, itemCount: 0, message: error?.message || 'Failed to update cart' };
    }
  }

  /**
   * Remove cart item via AJAX
   * Backend API: [HttpDelete("{cartId}")] with userId in header
   * Tries multiple endpoint patterns with 'omit' credentials to avoid CORS issues
   */
  async removeCartItemAjax(cartId: number): Promise<CartDataResponse> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      // Backend API: [HttpDelete("{cartId}")] with userId in header
      // Try multiple endpoint patterns with DELETE method first
      const endpoints = [
        // Primary: DELETE with cartId in route and userId in header
        { url: `${this.baseUrl}/Cart/${cartId}`, method: 'DELETE' as const, bodyType: 'none' as const },
        { url: `${this.baseUrl}/cart/${cartId}`, method: 'DELETE' as const, bodyType: 'none' as const },
        // Alternative DELETE patterns
        { url: `${this.baseUrl}/Cart/RemoveCartItem/${cartId}`, method: 'DELETE' as const, bodyType: 'none' as const },
        { url: `${this.baseUrl}/cart/RemoveCartItem/${cartId}`, method: 'DELETE' as const, bodyType: 'none' as const },
        // Fallback: POST methods
        { url: `${this.baseUrl}/Cart/${cartId}`, method: 'POST' as const, bodyType: 'json' as const },
        { url: `${this.baseUrl}/cart/${cartId}`, method: 'POST' as const, bodyType: 'json' as const },
        { url: `${this.baseUrl}/Cart/remove`, method: 'POST' as const, bodyType: 'form' as const },
        { url: `${this.baseUrl}/Cart/removecartitemajax`, method: 'POST' as const, bodyType: 'form' as const },
        { url: `${this.baseUrl}/cart/remove`, method: 'POST' as const, bodyType: 'form' as const },
        { url: `${this.baseUrl}/cart/removecartitemajax`, method: 'POST' as const, bodyType: 'form' as const },
        { url: `${this.baseUrl}/Cart/RemoveCartItemAjax`, method: 'POST' as const, bodyType: 'form' as const },
        { url: `${this.baseUrl}/cart/RemoveCartItemAjax`, method: 'POST' as const, bodyType: 'form' as const },
      ];
      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
          };

          let body: FormData | string | undefined = undefined;

          if (endpoint.bodyType === 'form') {
      const formData = new FormData();
      formData.append('cartId', cartId.toString());
            if (userId) {
              formData.append('userId', userId.toString());
            }
            body = formData;
          } else if (endpoint.bodyType === 'json') {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({ cartId, ...(userId && { userId }) });
          }
          // bodyType === 'none' means no body (for DELETE with cartId in URL)

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            ...(body && { body }),
            credentials: 'omit', // Use 'omit' to avoid CORS issues
            cache: 'no-cache',
          });

          if (response.ok) {
            // Try to get updated cart data from response
            try {
              const data = await response.json();
              // If response is CartDataResponse format, return it
              if (data.items || data.success !== undefined) {
                return data;
              }
              // Otherwise, return success and reload cart will happen via event
              return { success: true, items: [], total: 0, itemCount: 0, message: 'Item removed successfully' };
            } catch {
              // If response is empty or not JSON, still consider it success
              return { success: true, items: [], total: 0, itemCount: 0, message: 'Item removed successfully' };
            }
          } else if (response.status === 405) {
            // Method Not Allowed - try next endpoint
            lastError = new Error(`Method ${endpoint.method} not allowed`);
            continue;
          } else if (response.status === 404) {
            // Item not found - might already be removed, try next endpoint
            lastError = new Error('Item not found');
            continue;
          } else {
            lastError = new Error(`Failed to remove cart item: ${response.status} ${response.statusText}`);
      }
        } catch (error: any) {
          // Check if it's a CORS error
          const isCorsError = error.message?.includes('CORS') || 
                             error.message?.includes('Access-Control-Allow-Origin') ||
                             error.message?.includes('Failed to fetch');
          
          if (isCorsError) {
            lastError = error;
            continue;
          }
          
          // For network errors, continue to next endpoint
          if (error.message?.includes('fetch')) {
            lastError = error;
            continue;
          }
          
          throw error;
        }
      }

      // If all endpoints failed, return error response
      console.error('[CartService] All remove endpoints failed:', lastError);
      return { success: false, items: [], total: 0, itemCount: 0, message: lastError?.message || 'Failed to remove item' };
    } catch (error: any) {
      console.error('[CartService] Error removing cart item:', error);
      return { success: false, items: [], total: 0, itemCount: 0, message: error?.message || 'Failed to remove item' };
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // First, try to get token from localStorage (if stored separately)
    const tokenFromLocalStorage = localStorage.getItem('authToken');
    if (tokenFromLocalStorage) {
      return tokenFromLocalStorage;
    }
    
    // Otherwise, try to extract token from auth response in sessionStorage
    try {
      const authJson = sessionStorage.getItem('authenticatedUser');
      if (authJson) {
        const authResponse = JSON.parse(authJson);
        // AuthResponse has optional token field
        if (authResponse?.token) {
          return authResponse.token;
        }
      }
    } catch (error) {
      console.error('[CartService] Error extracting token from auth response:', error);
    }
    
    return null;
  }
}

export default new CartService();

