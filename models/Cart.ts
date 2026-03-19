/**
 * Cart Model
 * Defines the structure for shopping cart data matching ECommerce.Web
 */

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string;
  imageUrl: string;
  lineTotal: number;
}

export interface Cart {
  id?: number;
  userId: number;
  items: CartItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
  size?: string;
  redirectToCheckout?: boolean;
}

export interface UpdateCartItemRequest {
  cartId: number;
  quantity: number;
}

export interface RemoveCartItemRequest {
  cartId: number;
}

export interface CartDataResponse {
  success: boolean;
  items: CartItem[];
  total: number;
  itemCount: number;
  message?: string;
}

