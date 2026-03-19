/**
 * Voucher Model
 * Defines the structure for voucher/coupon data
 */

export interface Voucher {
  id: number;
  code: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  minimumPurchaseAmount?: number;
  maximumDiscountAmount?: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
