/**
 * PhonePe Payment Service
 * Handles PhonePe payment gateway integration
 */

import { CreatePaymentDto, PaymentResponse } from '@/models/Payment';
import environment from '@/config/environment';
import AuthService from '@/services/AuthService';

export interface PhonePePaymentRequest {
  orderId: string;
  userId: number;
  amount: number;
  currency?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  callbackUrl: string;
  redirectUrl: string;
}

export interface PhonePePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  redirectUrl?: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
  code?: string;
  message?: string;
}

class PhonePeService {
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
   * Initiate PhonePe payment
   */
  async initiatePayment(paymentData: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    try {
      // Validate and log payment data
      if (!paymentData) {
        console.error('PhonePeService.initiatePayment: paymentData is null or undefined');
        return { success: false, error: 'Payment data is required' };
      }
      
   
      
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      // Try multiple endpoint patterns
      const endpoints = [
        { url: `${this.baseUrl}/Payment/InitiatePhonePe`, method: 'POST' as const },
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
          };

          // Validate required fields
          if (!paymentData.orderId || !paymentData.userId || !paymentData.amount) {
            console.error('PhonePeService: Missing required fields', {
              hasOrderId: !!paymentData.orderId,
              hasUserId: !!paymentData.userId,
              hasAmount: !!paymentData.amount,
            });
            lastError = new Error('Missing required payment data: orderId, userId, or amount');
            continue;
          }

          // Try with "request" wrapper first (as backend might require it)
          const requestBodyWithWrapper = {
            request: {
              orderId: paymentData.orderId,
              userId: paymentData.userId,
              amount: paymentData.amount,
              currency: paymentData.currency || 'INR',
              callbackUrl: paymentData.callbackUrl,
              redirectUrl: paymentData.redirectUrl,
              customerName: paymentData.customerName,
              customerPhone: paymentData.customerPhone,
              customerEmail: paymentData.customerEmail,
            }
          };

          // Also prepare direct format
          const requestBodyDirect = {
            orderId: paymentData.orderId,
            userId: paymentData.userId,
            amount: paymentData.amount,
            currency: paymentData.currency || 'INR',
            callbackUrl: paymentData.callbackUrl,
            redirectUrl: paymentData.redirectUrl,
            customerName: paymentData.customerName,
            customerPhone: paymentData.customerPhone,
            customerEmail: paymentData.customerEmail,
          };


          // Try with request wrapper first
          let response = await fetch(endpoint.url, {
            
            method: endpoint.method,
            headers,
            body: JSON.stringify(requestBodyWithWrapper),
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
              const data = await response.json();
              
              // Handle different response formats
              let paymentUrl = data.paymentUrl || data.redirectUrl || data.url;
              
              // Check if response has nested structure (PhonePe API format)
              if (data.data?.instrumentResponse?.redirectInfo) {
                paymentUrl = data.data.instrumentResponse.redirectInfo;
              } else if (data.instrumentResponse?.redirectInfo) {
                paymentUrl = data.instrumentResponse.redirectInfo;
              } else if (data.response?.redirectInfo) {
                paymentUrl = data.response.redirectInfo;
              }

              return {
                success: true,
                paymentUrl: paymentUrl,
                redirectUrl: paymentUrl,
                transactionId: data.transactionId || data.transactionID || data.txnId,
                orderId: data.orderId || paymentData.orderId,
                code: data.code,
                message: data.message,
              };
            } catch (parseError) {
              // If response is not JSON, check if it's a redirect
              if (response.redirected) {
                return {
                  success: true,
                  redirectUrl: response.url,
                  paymentUrl: response.url,
                  orderId: paymentData.orderId,
                };
              }
              lastError = new Error('Invalid response format from payment gateway');
            }
          } else if (response.status === 401 || response.status === 403) {
            return { success: false, error: 'Please log in to process payment' };
          } else if (response.status !== 404 && response.status !== 405) {
            let errorText = '';
            let errorMessage = '';
            try {
              const errorData = await response.json();
              
              // Extract error message from various possible formats
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.title) {
                errorMessage = errorData.title;
              } else if (typeof errorData === 'string') {
                errorMessage = errorData;
              }
              
              // Check if it's an OAuth error
              if (errorMessage && (errorMessage.includes('OAuth') || errorMessage.includes('Failed to authenticate'))) {
                errorText = errorMessage;
                // Clean up the error message - remove newlines and format better
                errorText = errorText.replace(/\\n/g, '\n').trim();
              } else if (errorMessage) {
                errorText = errorMessage;
                // Include detailed error info if available
                if (errorData.errors) {
                  const errorDetails = Object.entries(errorData.errors)
                    .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
                  if (errorDetails) {
                    errorText += ` - ${errorDetails}`;
                  }
                }
              } else {
                errorText = JSON.stringify(errorData);
              }
            } catch {
              errorText = await response.text().catch(() => '');
              // Try to parse as text if JSON parsing failed
              if (errorText && (errorText.includes('OAuth') || errorText.includes('Failed to authenticate'))) {
                errorText = errorText.replace(/\\n/g, '\n').trim();
              }
            }
            
            // Check for OAuth-specific errors
            if (errorText.includes('OAuth') || errorText.includes('Failed to authenticate')) {
              lastError = new Error(`PhonePe OAuth Configuration Error\n\n${errorText}`);
            } else {
              lastError = new Error(`Payment initiation failed: ${response.status} ${response.statusText}. ${errorText}`);
            }
          }
        } catch (error: any) {
          // Check for network/timeout errors
          if (error?.message?.includes('connection') || 
              error?.message?.includes('timeout') || 
              error?.message?.includes('failed to fetch') ||
              error?.message?.includes('network') ||
              error?.name === 'TypeError' ||
              error?.code === 'ECONNREFUSED' ||
              error?.code === 'ETIMEDOUT') {
            lastError = new Error(
              'PhonePe API Connection Error: Unable to connect to PhonePe payment gateway. ' +
              'This could be due to:\n' +
              '• Network connectivity issues\n' +
              '• PhonePe API server is temporarily unavailable\n' +
              '• Firewall or proxy blocking the connection\n' +
              '• Incorrect API endpoint configuration\n\n' +
              'Please try again later or use an alternative payment method.'
            );
          } else {
            lastError = error;
          }
          continue;
        }
      }

      throw lastError || new Error('Failed to initiate payment: All endpoints failed');
    } catch (error: any) {
      console.error('Error initiating PhonePe payment:', error);
      
      // Check for connection/timeout errors
      if (error?.message?.includes('connection') || 
          error?.message?.includes('timeout') || 
          error?.message?.includes('failed to fetch') ||
          error?.message?.includes('network') ||
          error?.name === 'TypeError') {
        return {
          success: false,
          error: error.message || 
            'PhonePe API Connection Error: Unable to connect to PhonePe payment gateway. ' +
            'Please try again later or use an alternative payment method.',
        };
      }
      
      return {
        success: false,
        error: error?.message || 'Failed to initiate payment. Please try again.',
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderId: string, transactionId?: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      const endpoints = [
        { url: `${this.baseUrl}/Payment/VerifyPayment/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/payment/verifypayment/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/Payment/GetPaymentStatus/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/payment/getpaymentstatus/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/Payment/Status/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/payment/status/${orderId}`, method: 'GET' as const },
      ];

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
            ...(transactionId && { 'transactionId': transactionId }),
          };

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            credentials: 'omit',
            cache: 'no-cache',
          });

          if (response.ok) {
            try {
              const data = await response.json();
              return {
                success: true,
                status: data.status || data.paymentStatus || data.payment?.status || 'Unknown',
              };
            } catch {
              return { success: true, status: 'Unknown' };
            }
          }
        } catch (error) {
          continue;
        }
      }

      return { success: false, error: 'Failed to verify payment status' };
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error?.message || 'Failed to verify payment status',
      };
    }
  }

  /**
   * Update payment status on backend (after redirect from PhonePe).
   * Call this so the attached API can persist order payment status.
   */
  async updatePaymentStatus(params: {
    orderId: string;
    status?: string;
    transactionId?: string;
    code?: string;
    message?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      const endpoints = [
        { url: `${this.baseUrl}/Payment/UpdatePaymentStatus`, method: 'POST' as const },
        { url: `${this.baseUrl}/payment/updatepaymentstatus`, method: 'POST' as const },
        { url: `${this.baseUrl}/Payment/PhonePeCallback`, method: 'POST' as const },
        { url: `${this.baseUrl}/payment/phonepecallback`, method: 'POST' as const },
        { url: `${this.baseUrl}/Payment/Callback`, method: 'POST' as const },
        { url: `${this.baseUrl}/payment/callback`, method: 'POST' as const },
      ];
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userId && { 'userId': userId.toString() }),
      };
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify({ request: params, ...params }),
            credentials: 'omit',
            cache: 'no-cache',
          });
          if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
              success: true,
              status: data.status || data.paymentStatus || params.status,
            };
          }
        } catch {
          continue;
        }
      }
      return { success: false, error: 'Failed to update payment status' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to update payment status' };
    }
  }

  /**
   * Handle payment callback from PhonePe (notify backend so it can update order/payment status).
   */
  async handleCallback(callbackData: any): Promise<{ success: boolean; orderId?: string; status?: string; error?: string }> {
    try {
      const token = this.getToken();
      const userId = AuthService.getCurrentUserId();
      
      const endpoints = [
        { url: `${this.baseUrl}/Payment/Callback`, method: 'POST' as const },
        { url: `${this.baseUrl}/payment/callback`, method: 'POST' as const },
        { url: `${this.baseUrl}/Payment/PhonePeCallback`, method: 'POST' as const },
        { url: `${this.baseUrl}/payment/phonepecallback`, method: 'POST' as const },
      ];

      for (const endpoint of endpoints) {
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
          };

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(callbackData),
            credentials: 'omit',
            cache: 'no-cache',
          });

          if (response.ok) {
            try {
              const data = await response.json();
              return {
                success: true,
                orderId: data.orderId || callbackData.orderId,
                status: data.status || data.paymentStatus || 'Success',
              };
            } catch {
              return {
                success: true,
                orderId: callbackData.orderId,
                status: 'Success',
              };
            }
          }
        } catch (error) {
          continue;
        }
      }

      return { success: false, error: 'Failed to process payment callback' };
    } catch (error: any) {
      console.error('Error handling payment callback:', error);
      return {
        success: false,
        error: error?.message || 'Failed to process payment callback',
      };
    }
  }
}

export default new PhonePeService();
