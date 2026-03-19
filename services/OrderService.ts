
/**
 * Order Service
 * Handles order-related business logic and API calls
 */

import { Order } from '@/models/Order';
import { PaymentStatus } from '@/models/Payment';
import environment from '@/config/environment';
import AuthService from '@/services/AuthService';

export interface OrderItem {
  id: number;
  orderId: string;
  productId: number;
  productName?: string;
  productImage?: string;
  quantity: number;
  price: number;
  lineTotal: number;
  size?: string;
}

export interface OrderDetail {
  id: number;
  orderId: string;
  userId: number;
  totalAmount: number;
  status: string;
  orderStatus?: string; // Pending, Packed, ReadyForDispatch
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
  shippingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

class OrderService {
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
   * Get orders for current user
   * Filters to show only successfully created and paid orders
   */
  async getOrdersByUserId(userId: number): Promise<OrderDetail[]> {
    try {
      const token = this.getToken();
      
      // Use the correct API endpoint: GET api/MyOrders with userId in header
      // baseUrl already includes /api, so we just need /MyOrders
      const endpoints = [
        { url: `${this.baseUrl}/MyOrders`, method: 'GET' as const },
      ];

      let lastError: any = null;
      const triedEndpoints: string[] = [];

      for (const endpoint of endpoints) {
        try {
          triedEndpoints.push(`${endpoint.method} ${endpoint.url}`);
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(userId && { 'userId': userId.toString() }),
          };

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            credentials: 'omit',
            cache: 'no-cache',
          });
          
          console.log('Orders API Response Status:', response.status, response.statusText);
          if (response.ok) {
            const data = await response.json();
            console.log('Orders API Response:', data);
            
            // Handle different response formats
            let rawOrders: any[] = [];
            
            if (Array.isArray(data)) {
              rawOrders = data;
            } else if (data.orders && Array.isArray(data.orders)) {
              rawOrders = data.orders;
            } else if (data.data && Array.isArray(data.data)) {
              rawOrders = data.data;
            } else if (data.items && Array.isArray(data.items)) {
              rawOrders = data.items;
            }

            console.log('Extracted orders:', rawOrders);

            // Normalize order data first (backend already filters for completed payments)
            const normalizedOrders = rawOrders.map(order => this.normalizeOrder(order));
            
            console.log('Normalized orders:', normalizedOrders);

            // Filter to show only successfully created and paid orders (additional safety check)
            const filteredOrders = normalizedOrders.filter(order => {
              // Backend already returns only completed payments, but add safety check
              const isPaid = order.paymentStatus === 'Success' || 
                            order.paymentStatus === 'Paid' ||
                            order.paymentStatus === 'Completed' ||
                            // If paymentStatus is not available but we have items, assume paid
                            (!order.paymentStatus && order.items && order.items.length > 0);
              
              return isPaid;
            });

            console.log('Filtered orders:', filteredOrders);
            return filteredOrders;
          } else if (response.status === 401 || response.status === 403) {
            return [];
          } else if (response.status !== 404 && response.status !== 405) {
            const errorText = await response.text().catch(() => '');
            lastError = new Error(`Failed to fetch orders: ${response.status} ${response.statusText}. ${errorText}`);
          }
        } catch (error: any) {
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, provide detailed error message
      const errorMessage = lastError?.message || 'Failed to fetch orders: All endpoints failed';
      const triedEndpointsStr = triedEndpoints.length > 0 
        ? `\n\nTried endpoints:\n${triedEndpoints.map(e => `  - ${e}`).join('\n')}`
        : '';
      
      throw new Error(`${errorMessage}${triedEndpointsStr}\n\nPlease verify that the backend API has one of these endpoints implemented.`);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      // Return empty array instead of throwing to prevent UI crashes
      // The error will be logged and can be shown in the UI if needed
      return [];
    }
  }

  /**
   * Get all orders (for admin)
   */
  async getAllOrders(): Promise<OrderDetail[]> {
    try {
      const token = this.getToken();
      
      // Try multiple endpoint patterns for admin orders
      const endpoints = [
        { url: `${this.baseUrl}/Order/GetAllOrders`, method: 'GET' as const },
        { url: `${this.baseUrl}/order/getallorders`, method: 'GET' as const },
        { url: `${this.baseUrl}/Order/GetOrders`, method: 'GET' as const },
        { url: `${this.baseUrl}/order/getorders`, method: 'GET' as const },
        { url: `${this.baseUrl}/Order`, method: 'GET' as const },
        { url: `${this.baseUrl}/order`, method: 'GET' as const },
      ];

      let lastError: any = null;
      const triedEndpoints: string[] = [];

      for (const endpoint of endpoints) {
        try {
          triedEndpoints.push(`${endpoint.method} ${endpoint.url}`);
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          };

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            credentials: 'omit',
            cache: 'no-cache',
          });

          if (response.ok) {
            const data = await response.json();
            
            // Handle different response formats
            let orders: OrderDetail[] = [];
            
            if (Array.isArray(data)) {
              orders = data;
            } else if (data.orders && Array.isArray(data.orders)) {
              orders = data.orders;
            } else if (data.data && Array.isArray(data.data)) {
              orders = data.data;
            } else if (data.items && Array.isArray(data.items)) {
              orders = data.items;
            }

            // Normalize order data
            return orders.map(order => this.normalizeOrder(order));
          } else if (response.status === 401 || response.status === 403) {
            return [];
          } else if (response.status !== 404 && response.status !== 405) {
            const errorText = await response.text().catch(() => '');
            lastError = new Error(`Failed to fetch orders: ${response.status} ${response.statusText}. ${errorText}`);
          }
        } catch (error: any) {
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, provide detailed error message
      const errorMessage = lastError?.message || 'Failed to fetch orders: All endpoints failed';
      const triedEndpointsStr = triedEndpoints.length > 0 
        ? `\n\nTried endpoints:\n${triedEndpoints.map((e: string) => `  - ${e}`).join('\n')}`
        : '';
      
      throw new Error(`${errorMessage}${triedEndpointsStr}\n\nPlease verify that the backend API has one of these endpoints implemented.`);
    } catch (error: any) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }

  /**
   * Get order details by order ID
   */
  async getOrderById(orderId: string, userId: number): Promise<OrderDetail | null> {
    try {
      const token = this.getToken();
      
      const endpoints = [
        { url: `${this.baseUrl}/Order/GetOrder/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/order/getorder/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/Order/${orderId}`, method: 'GET' as const },
        { url: `${this.baseUrl}/order/${orderId}`, method: 'GET' as const },
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
            credentials: 'omit',
            cache: 'no-cache',
          });

          if (response.ok) {
            const data = await response.json();
            return this.normalizeOrder(data);
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  /**
   * Normalize order data to consistent format
   * Handles both CustomerOrderGroupDto (from backend) and other formats
   */
  private normalizeOrder(order: any): OrderDetail {
    // Handle CustomerOrderGroupDto format from backend API
    // Check for orderId and orderItems (handle both camelCase and PascalCase)
    const orderId = order.orderId || order.OrderId || '';
    const orderItems = order.orderItems || order.OrderItems || [];
    
    if (orderId && Array.isArray(orderItems) && orderItems.length > 0) {
      const customerInfo = order.customerInfo || order.CustomerInfo;
      
      return {
        id: order.id || 0,
        orderId: orderId,
        userId: customerInfo?.userId || customerInfo?.UserId || 0,
        totalAmount: order.totalAmount || order.TotalAmount || 0,
        status: 'Completed', // All orders from this endpoint are completed
        paymentStatus: order.paymentStatus || order.PaymentStatus || 'Completed',
        paymentMethod: 'PhonePe', // Default payment method
        createdAt: order.orderDate || order.OrderDate || order.createdAt,
        updatedAt: order.orderDate || order.OrderDate || order.updatedAt,
        items: this.normalizeOrderItems(orderItems),
        shippingAddress: customerInfo ? {
          firstName: customerInfo.firstName || customerInfo.FirstName || '',
          lastName: customerInfo.lastName || customerInfo.LastName || '',
          email: customerInfo.email || customerInfo.Email || '',
          phone: customerInfo.phone || customerInfo.Phone || '',
          address: customerInfo.address || customerInfo.Address || '',
          city: (customerInfo.city || customerInfo.City)?.toString() || '',
          state: (customerInfo.state || customerInfo.State)?.toString() || '',
          pincode: customerInfo.zipCode || customerInfo.ZipCode || customerInfo.pincode || '',
          country: (customerInfo.country || customerInfo.Country)?.toString() || '1',
        } : undefined,
      };
    }

    // Handle other order formats
    return {
      id: order.id || order.orderId || 0,
      orderId: order.orderId || order.orderID || order.id?.toString() || '',
      userId: order.userId || order.userID || 0,
      totalAmount: order.totalAmount || order.total || order.amount || 0,
      status: order.status || order.orderStatus || 'Pending',
      paymentStatus: order.paymentStatus || order.payment?.status || 
                     (order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' ? 'Success' : undefined),
      paymentMethod: order.paymentMethod || order.payment?.method || order.paymentMethod,
      createdAt: order.createdAt || order.createdDate || order.dateCreated || order.orderDate,
      updatedAt: order.updatedAt || order.updatedDate,
      items: this.normalizeOrderItems(order.items || order.orderItems || []),
      shippingAddress: order.shippingAddress || order.address || (order.customerInfo ? {
        firstName: order.customerInfo.firstName || order.firstName,
        lastName: order.customerInfo.lastName || order.lastName,
        email: order.customerInfo.email || order.email,
        phone: order.customerInfo.phone || order.phone,
        address: order.customerInfo.address || order.address,
        city: order.customerInfo.city?.toString() || order.city,
        state: order.customerInfo.state?.toString() || order.state,
        pincode: order.customerInfo.zipCode || order.pincode || order.zipCode,
        country: order.customerInfo.country?.toString() || order.country || '1',
      } : undefined),
    };
  }

  /**
   * Normalize order items data
   * Handles OrderDetailDto format from backend (both camelCase and PascalCase)
   */
  private normalizeOrderItems(items: any[]): OrderItem[] {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => {
      // Handle both camelCase and PascalCase property names
      const productImageUrl = item.productImageUrl || item.ProductImageUrl || 
                             item.productImage || item.ProductImage || 
                             item.image || item.Image || 
                             item.imageUrl || item.ImageUrl || 
                             item.product?.image || item.product?.imageUrl || '';
      
      const price = item.price || item.Price || item.unitPrice || item.UnitPrice || item.productPrice || 0;
      const quantity = item.quantity || item.Quantity || item.qty || 1;
      
      return {
        id: item.id || item.Id || 0,
        orderId: item.orderId || item.OrderId || item.orderID || '',
        productId: item.productId || item.ProductId || item.productID || 0,
        productName: item.productName || item.ProductName || item.name || item.Name || item.product?.name || 'Unknown Product',
        productImage: productImageUrl,
        quantity: quantity,
        price: price,
        lineTotal: item.lineTotal || item.LineTotal || item.total || item.Total || (price * quantity),
        size: item.size || item.Size || item.productSize || '',
      };
    });
  }
}

export default new OrderService();
