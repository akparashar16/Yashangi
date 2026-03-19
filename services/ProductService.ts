/**
 * Product Service
 * Handles all product-related business logic and API calls matching ECommerce.Web
 */

import { Product, ProductFilters, PagedResult } from '@/models/Product';
import environment from '@/config/environment';
import AuthService from './AuthService';

class ProductService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    try {
      // First, try to get token from localStorage (if stored separately)
      const token = localStorage.getItem('authToken');
      if (token) return token;

      // Otherwise, try to extract token from auth response in sessionStorage
      const authResponse = AuthService.getCurrentUser();
      if (authResponse?.token) {
        return authResponse.token;
      }

      return null;
    } catch (error) {
      console.error('[ProductService] Error extracting token:', error);
      return null;
    }
  }

  /**
   * Fetch all products with pagination
   * Ensures encryptedId is used for all products
   */
  async getProductsPaged(page: number = 1, pageSize: number = 12): Promise<PagedResult<Product>> {
    try {
      const response = await fetch(`${this.baseUrl}/Products/paged?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      
      
      // Ensure all products use encryptedId if available
      // Check both camelCase and PascalCase (in case JSON naming policy isn't applied)
      if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map((product: Product) => {
          const encryptedId = product.encryptedId || (product as any).EncryptedId;
          if (!encryptedId) {
            console.warn('[ProductService] Product in paged response missing encryptedId:', product.id, product.name);
          }
          return {
            ...product,
            encryptedId: encryptedId,
          };
        });
      }
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetch all products with optional filters
   * Ensures encryptedId is used for all products
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `${this.baseUrl}/Products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const products = await response.json();
      
     
      
      // Ensure all products use encryptedId if available
      // Check both camelCase and PascalCase (in case JSON naming policy isn't applied)
      return Array.isArray(products) 
        ? products.map((product: Product) => {
            const encryptedId = product.encryptedId || (product as any).EncryptedId;
            if (!encryptedId) {
              console.warn('[ProductService] Product missing encryptedId:', product.id, product.name);
            }
            return {
              ...product,
              encryptedId: encryptedId,
            };
          })
        : products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetch products by category
   * Matches ECommerce.Web GetAllProductsByCategoryAsync functionality
   * Tries multiple endpoint patterns to match the backend API
   */
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    try {
      // Try multiple endpoint patterns
      const endpoints = [
        `${this.baseUrl}/Collection?categoryId=${categoryId}`,
        `${this.baseUrl}/Collection?GetKurta`,
        `${this.baseUrl}/Collection/category/${categoryId}`,
        `${this.baseUrl}/Collection/GetAllProductsByCategory?categoryId=${categoryId}`,
      ];

      for (const url of endpoints) {
        try {
         
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            // Handle different response formats
            if (Array.isArray(data)) {
              return data;
            } else if (data.items && Array.isArray(data.items)) {
              return data.items;
            } else if (data.products && Array.isArray(data.products)) {
              return data.products;
            } else if (data.data && Array.isArray(data.data)) {
              return data.data;
            } else {
              console.warn('Unexpected response format:', data);
              return [];
            }
          } else {
            console.warn(`Endpoint ${url} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`Error with endpoint ${url}:`, err);
          continue; // Try next endpoint
        }
      }

      // If all endpoints fail, try using getProducts with filters
    
      return await this.getProducts({ categoryId });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      // Return empty array instead of throwing to prevent page crash
      console.warn('Returning empty array due to fetch error. API may not be available.');
      return [];
    }
  }

  /**
   * Fetch a single product by ID (accepts encrypted ID or numeric ID)
   * Always uses encrypted ID for fetching - converts numeric ID to encrypted if needed
   */
  async getProductById(id: number | string): Promise<Product> {
    try {
      // Always use the ID as-is (prefer encrypted string if available)
      // The backend will handle decryption if it's an encrypted string
      const idParam = typeof id === 'string' ? id : id.toString();
      const response = await fetch(`${this.baseUrl}/Products/${idParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const product = await response.json();
      

      
      // Ensure encryptedId is available in the response
      // Check both camelCase and PascalCase (in case JSON naming policy isn't applied)
      const encryptedId = product.encryptedId || (product as any).EncryptedId;
      
      if (!encryptedId) {
        console.error('[ProductService.getProductById] ERROR: encryptedId not found in API response!');
        console.error('[ProductService.getProductById] All product properties:', Object.keys(product));
        console.error('[ProductService.getProductById] Product ID:', product.id);
        console.error('[ProductService.getProductById] API URL called:', `${this.baseUrl}/Products/${idParam}`);
        // This is a critical issue - the API should always return encryptedId
        // Don't throw error, but log it clearly for debugging
      } else {
        console.log('Successfully received encryptedId');
      }
      
      return {
        ...product,
        encryptedId: encryptedId,
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   * API expects FormData with product data and images
   */
  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    mrp: number;
    stock: number;
    sku?: string;
    categoryId?: number;
    subcategoryId?: number;
    costing?: number;
    variants?: Array<{ size: string; price: number }>;
  }, images?: File[]): Promise<Product> {
    try {
      const formData = new FormData();
      
      // Add required product fields
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('mrp', productData.mrp.toString());
      formData.append('stock', productData.stock.toString());
      
      // Add costing (required field)
      formData.append('costing', (productData.costing ?? 0).toString());
      
      // Add SKU (optional, but send empty string if not provided)
      formData.append('sku', productData.sku || '');
      
      // Add categoryId (required field)
      formData.append('categoryId', (productData.categoryId ?? 0).toString());
      
      // Add subcategoryId (required field, can be 0 if not selected)
      formData.append('subcategoryId', (productData.subcategoryId ?? 0).toString());

      // Add variants as a JSON string (always send, even if empty array)
      const variantsToSend = productData.variants && productData.variants.length > 0 
        ? productData.variants 
        : [];
      formData.append('variants', JSON.stringify(variantsToSend));

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const token = this.getToken();
      const headers: HeadersInit = {};
      
      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Don't set Content-Type header - browser will set it with boundary for FormData
      const response = await fetch(`${this.baseUrl}/Products`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create product';
        try {
          const errorData = await response.json();
          console.error('[ProductService] Error response:', errorData);
          
          // Handle ModelState errors (validation errors)
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
          console.error('[ProductService] Error text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const createdProduct = await response.json();
      // Ensure encryptedId is available in the response
      return {
        ...createdProduct,
        encryptedId: createdProduct.encryptedId || (createdProduct as any).encryptedId,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   * API expects FormData with product data and images
   * Accepts encrypted ID or numeric ID
   */
  async updateProduct(id: number | string, productData: {
    name: string;
    description: string;
    price: number;
    mrp: number;
    stock: number;
    sku?: string;
    categoryId?: number;
    subcategoryId?: number;
    costing?: number;
    variants?: Array<{ size: string; price: number }>;
  }, images?: File[]): Promise<Product> {
    try {

      
      const formData = new FormData();
      
      // Add required product fields
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('mrp', productData.mrp.toString());
      formData.append('stock', productData.stock.toString());
      
      // Add costing (required field)
      formData.append('costing', (productData.costing ?? 0).toString());
      
      // Add SKU (optional, but send empty string if not provided)
      formData.append('sku', productData.sku || '');
      
      // Add categoryId (required field)
      formData.append('categoryId', (productData.categoryId ?? 0).toString());
      
      // Add subcategoryId (required field, can be 0 if not selected)
      formData.append('subcategoryId', (productData.subcategoryId ?? 0).toString());

      // Add variants as a JSON string (always send, even if empty array)
      const variantsToSend = productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0 
        ? productData.variants 
        : [];
      const variantsJson = JSON.stringify(variantsToSend);
      formData.append('variants', variantsJson);

      
      // Log all FormData entries for debugging
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(``);
        } else {
          console.log(``);
        }
      }

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const token = this.getToken();
      const headers: HeadersInit = {};
      
      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Don't set Content-Type header - browser will set it with boundary for FormData
      const idParam = typeof id === 'string' ? id : id.toString();
      const response = await fetch(`${this.baseUrl}/Products/${idParam}`, {
        method: 'PUT',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update product';
        try {
          const errorData = await response.json();
          console.error('[ProductService] Error response:', errorData);
          
          // Handle ModelState errors (validation errors)
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
          console.error('[ProductService] Error text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update product';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updatedProduct = await response.json();
      // Ensure encryptedId is available in the response
      return {
        ...updatedProduct,
        encryptedId: updatedProduct.encryptedId || (updatedProduct as any).encryptedId,
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product image (accepts encrypted ID or numeric ID)
   */
  async deleteProductImage(imageId: number | string, productId?: number | string): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const imageIdParam = typeof imageId === 'string' ? imageId : imageId.toString();
      let url = `${this.baseUrl}/Products/image/${imageIdParam}`;
      if (productId) {
        const productIdParam = typeof productId === 'string' ? productId : productId.toString();
        url += `?productId=${encodeURIComponent(productIdParam)}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete image';
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
      console.error('Error deleting product image:', error);
      throw error;
    }
  }

  /**
   * Delete a product (accepts encrypted ID or numeric ID)
   */
  async deleteProduct(id: number | string): Promise<boolean> {
    try {
      const idParam = typeof id === 'string' ? id : id.toString();
      const response = await fetch(`${this.baseUrl}/Products/${idParam}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete product';
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
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}

export default new ProductService();

