/**
 * Voucher Service
 * Handles voucher-related business logic and API calls
 */

import { Voucher } from '@/models/Voucher';
import environment from '@/config/environment';
import AuthService from './AuthService';

class VoucherService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Get all vouchers
   */
  async getAllVouchers(): Promise<Voucher[]> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/vouchers`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vouchers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      throw error;
    }
  }

  /**
   * Get voucher by ID
   */
  async getVoucherById(id: number): Promise<Voucher> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/vouchers/${id}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Voucher not found');
        }
        throw new Error(`Failed to fetch voucher: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voucher:', error);
      throw error;
    }
  }

  /**
   * Create a new voucher
   */
  async createVoucher(voucherData: {
    code: string;
    description?: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountValue: number;
    minimumPurchaseAmount?: number;
    maximumDiscountAmount?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    usageLimit?: number;
  }): Promise<Voucher> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/vouchers`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(voucherData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create voucher';
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const validationErrors = Object.entries(errorData.errors)
              .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            errorMessage = `Validation errors:\n${validationErrors}`;
          } else {
            errorMessage = errorData.message || errorData.title || errorMessage;
          }
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }
  }

  /**
   * Update an existing voucher
   */
  async updateVoucher(id: number, voucherData: {
    code: string;
    description?: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountValue: number;
    minimumPurchaseAmount?: number;
    maximumDiscountAmount?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    usageLimit?: number;
  }): Promise<Voucher> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/vouchers/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(voucherData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Voucher not found');
        }
        let errorMessage = 'Failed to update voucher';
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const validationErrors = Object.entries(errorData.errors)
              .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            errorMessage = `Validation errors:\n${validationErrors}`;
          } else {
            errorMessage = errorData.message || errorData.title || errorMessage;
          }
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating voucher:', error);
      throw error;
    }
  }

  /**
   * Delete a voucher
   */
  async deleteVoucher(id: number): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/vouchers/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete voucher';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Error deleting voucher:', error);
      throw error;
    }
  }

  /**
   * Validate voucher and calculate discount
   * This endpoint is publicly accessible (no auth required)
   */
  async validateVoucher(code: string, totalAmount: number): Promise<{
    isValid: boolean;
    voucher?: Voucher;
    discountAmount?: number;
    message: string;
  }> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Voucher validation is public - no auth required

      const response = await fetch(`${this.baseUrl}/vouchers/validate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          totalAmount: totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to validate voucher' }));
        return {
          isValid: false,
          message: errorData.message || 'Invalid voucher code',
        };
      }

      const data = await response.json();
      return {
        isValid: data.isValid,
        voucher: data.voucher,
        discountAmount: data.discountAmount,
        message: data.message || 'Voucher validated successfully',
      };
    } catch (error) {
      console.error('Error validating voucher:', error);
      return {
        isValid: false,
        message: 'Failed to validate voucher. Please try again.',
      };
    }
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    try {
      const token = localStorage.getItem('authToken');
      if (token) return token;

      const authResponse = AuthService.getCurrentUser();
      if (authResponse?.token) {
        return authResponse.token;
      }

      return null;
    } catch (error) {
      console.error('[VoucherService] Error extracting token:', error);
      return null;
    }
  }
}

export default new VoucherService();
