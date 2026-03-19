/**
 * Checkout Service
 * Handles checkout-related business logic and API calls.
 * Flow: Submit checkout → API saves cart to DB, creates order, and initiates PhonePe payment → returns redirect URL → redirect to PhonePe → callback updates status.
 */

import { CheckoutFormData } from '@/models/Order';
import { CartItem } from '@/models/Cart';
import environment from '@/config/environment';
import AuthService from '@/services/AuthService';

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

class CheckoutService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  private getToken(): string | null {
    // Try localStorage first
    const token = localStorage.getItem('authToken');
    if (token) return token;
    
    // Try sessionStorage
    const userStr = sessionStorage.getItem('authenticatedUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.token || null;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Build cart/order items for API (save cart data in database).
   */
  private buildOrderItems(cartItems: CartItem[]): any[] {
    return cartItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      size: item.size || '',
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      imageUrl: item.imageUrl,
    }));
  }

  /**
   * Submit checkout: save cart data in DB via connected API, get order details,
   * then call PhonePe service and return payment page URL for redirect.
   */
  async submitCheckout(
    formData: CheckoutFormData,
    cartItems: CartItem[],
    cartTotal: number,
    voucherCode?: string
  ): Promise<{ success: boolean; redirectUrl?: string; orderId?: string; error?: string }> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      if (!userId) {
        return { success: false, error: 'Please log in to complete checkout' };
      }

      // Use the correct API endpoint: /api/Checkout/submit
      // This endpoint saves cart to DB, creates order, and initiates PhonePe payment
      // Call backend directly (Next.js route is just a proxy, so call backend directly)
      const endpoints = [
        { url: `${this.baseUrl}/Checkout/submit`, method: 'POST' as const },
      ];

      let lastError: any = null;
      let orderId: string | undefined;
      let orderDetails: PlaceOrderResponse | undefined;
      const triedEndpoints: string[] = [];

      const orderItems = this.buildOrderItems(cartItems);

      // Request body matching API CheckoutSubmitRequest format (direct, not wrapped)
      const requestBody = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        state: formData.state,
        phone: formData.phone,
        country: formData.country || '1',
        paymentMethod: formData.paymentMethod || 'PhonePe',
        voucherCode: voucherCode || null,
        totalAmount: cartTotal,
      };

      // Call backend directly - /api/Checkout/submit
      for (const endpoint of endpoints) {
      try {
          triedEndpoints.push(`${endpoint.method} ${endpoint.url}`);
          // Get frontend base URL for redirect
          const frontendBaseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : 'https://www.yashangi.com';

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(userId && { 'userId': userId.toString() }),
            'X-Frontend-Base-Url': frontendBaseUrl,
        };

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
          headers,
            body: JSON.stringify(requestBody),
          credentials: 'omit',
          cache: 'no-cache',
        });

        if (response.ok) {
          try {
            const data: PlaceOrderResponse = await response.json();
            orderDetails = data;
            orderId = data.orderId ?? data.id?.toString();
            if (!orderId && data.orderID) orderId = data.orderID;
            if (!orderId && data.order_id) orderId = data.order_id;
            
              // API already handles PhonePe payment initiation and returns redirect URL
              // Check for paymentRedirectUrl in response (from CheckoutSubmitResponse)
              const paymentRedirectUrl = data.paymentRedirectUrl || data.redirectUrl || data.paymentUrl || data.url;

              if (paymentRedirectUrl) {
                return {
                  success: true,
                  orderId: orderId?.toString() || 'unknown',
                  redirectUrl: paymentRedirectUrl,
                };
              }
              
              // If PhonePe payment method but no redirect URL, check if payment was initiated
              if ((formData.paymentMethod === 'PhonePe' || !formData.paymentMethod)) {
                // If we have orderId but no redirect URL, payment initiation might have failed
                if (orderId && !paymentRedirectUrl) {
                return {
                  success: false,
                  orderId: orderId.toString(),
                    error: data.message || 'Payment initiation failed. Please try again.',
                };
                }
              }
              
              return {
                success: true,
              orderId: orderId?.toString(),
                redirectUrl: paymentRedirectUrl,
            };
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
            if (response.redirected) return { success: true, redirectUrl: response.url };
            return { success: true, orderId: 'unknown' };
          }
        } else if (response.status === 401 || response.status === 403) {
          return { success: false, error: 'Please log in to complete checkout' };
          } else if (response.status === 400) {
            // Bad request - try to get error details
            try {
              const errorData = await response.json();
              const errorMessage = errorData.message || JSON.stringify(errorData);
              lastError = new Error(`Checkout validation failed: ${errorMessage}`);
              } catch {
              const errorText = await response.text().catch(() => '');
              lastError = new Error(`Checkout failed: ${response.status} ${response.statusText}. ${errorText}`);
            }
          } else if (response.status !== 404 && response.status !== 405) {
              const errorText = await response.text().catch(() => '');
              lastError = new Error(`Checkout failed: ${response.status} ${response.statusText}. ${errorText}`);
            }
          } catch (error: any) {
            if (error?.message?.includes('connection') || error?.message?.includes('timeout') || error?.message?.includes('failed to fetch')) {
              lastError = error;
              continue;
            }
            lastError = error;
            break;
        }
      }

      // If all endpoints failed, provide detailed error message
      const errorMessage = lastError?.message || 'Failed to process checkout: All endpoints failed';
      const triedEndpointsStr = triedEndpoints.length > 0 
        ? `\n\nTried endpoints:\n${triedEndpoints.map(e => `  - ${e}`).join('\n')}`
        : '';
      
      throw new Error(`${errorMessage}${triedEndpointsStr}\n\nPlease verify that the backend API has one of these endpoints implemented.`);
    } catch (error: any) {
      console.error('Error submitting checkout:', error);
      const errorMsg = error?.message || 'Failed to process checkout. Please try again.';
      return { 
        success: false, 
        error: errorMsg
      };
    }
  }
}

export default new CheckoutService();

