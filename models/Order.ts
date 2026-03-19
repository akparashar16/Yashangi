/**
 * Order Model
 * Defines the structure for order data
 */

export interface Order {
  id: number;
  orderId: string;
  userId: number;
  productId: number;
  quantity: number;
  price: number;
  size: string;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfirmOrder {
  id: number;
  orderId: string;
  productId: number;
  quantity: number;
  price: number;
  size: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: number;
  orderID: string;
  totalOrders: number;
  totalSpent: number;
}

export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface CheckoutFormData {
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
}

