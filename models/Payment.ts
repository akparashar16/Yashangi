/**
 * Payment Model
 * Defines the structure for payment data
 */

export interface Payment {
  id: number;
  orderId: string;
  userId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum PaymentStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Success = 'Success',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export interface CreatePaymentDto {
  orderId: string;
  userId: number;
  amount: number;
  currency: string;
  callbackUrl: string;
  redirectUrl: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export interface PaymentResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: {
    instrumentResponse?: {
      redirectInfo?: string;
    };
  };
}

