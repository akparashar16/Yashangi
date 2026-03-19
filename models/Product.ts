/**
 * Product Model
 * Defines the structure for product data matching ECommerce.Web
 */

export interface Product {
  id: number;
  encryptedId?: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  costing?: number;
  stock: number;
  sku?: string;
  categoryId?: number;
  categoryName?: string;
  subcategoryId?: number;
  subcategoryName?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  isPrimaryProduct?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imagePath: string;
  imageName?: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  stock: number;
  price?: number;
}

export interface Review {
  id: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductFilters {
  categoryId?: number;
  subcategoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'rating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  startPage: number;
  endPage: number;
}

export interface ProductResponse extends PagedResult<Product> {}

