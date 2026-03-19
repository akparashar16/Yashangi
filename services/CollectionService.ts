/**
 * Collection Service
 * Handles collection-related operations matching ECommerce.Web CollectionController
 * Calls API endpoints directly: Collection/GetKurta(), Collection/GetTop(), etc.
 */

import { Product } from '@/models/Product';
import environment from '@/config/environment';

class CollectionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
    debugger;
  }

  /**
   * Get Kurta products
   * Calls API: GET Collection/GetKurta() or Collection/Kurta
   * Matches CollectionController.Kurta()
   */
  async getKurtaProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/kurta`, // User's working endpoint (lowercase action)
      `${this.baseUrl}/Collection/Kurta`, // Capitalized action
      `${this.baseUrl}/Collection/GetKurta`, // With Get prefix
      `${this.baseUrl}/collection/kurta`, // lowercase controller
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        console.log(`[CollectionService] Calling API: ${url}`);
   
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && errorDetails.includes('object cycle') || errorDetails.includes('circular')) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Kurta products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed for Kurta products');
  }

  /**
   * Get Top products
   * Calls API: GET Collection/GetTop() or Collection/Top
   * Matches CollectionController.Top()
   */
  async getTopProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/top`, // User's working endpoint (lowercase action)
      `${this.baseUrl}/Collection/Top`, // Capitalized action
      `${this.baseUrl}/Collection/GetTop`, // With Get prefix
      `${this.baseUrl}/collection/top`, // lowercase controller
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        console.log(`[CollectionService] Calling API: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && (errorDetails.includes('object cycle') || errorDetails.includes('circular'))) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Top products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints dres
    throw lastError || new Error('All endpoints failed for Top products');
  }

  /**
   * Get Kurti products
   * Calls API: GET Collection/GetKurti() or Collection/Kurti
   * Matches CollectionController.Kurti()
   */
  async getKurtiProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/kurti`, // User's working endpoint (lowercase action)
      `${this.baseUrl}/Collection/Kurti`, // Capitalized action
      `${this.baseUrl}/Collection/GetKurti`, // With Get prefix
      `${this.baseUrl}/collection/kurti`, // lowercase controller
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        console.log(`[CollectionService] Calling API: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && (errorDetails.includes('object cycle') || errorDetails.includes('circular'))) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Kurti products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed for Kurti products');
  }

  /**
   * Get Kurta Set products
   * Calls API: GET Collection/kurta-set or Collection/GetKurtaSet()
   * Matches CollectionController.KurtaSet()
   */
  async getKurtaSetProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase hyphenated as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/kurta-set`, // User's working endpoint (lowercase hyphenated)
      `${this.baseUrl}/Collection/KurtaSet`, // PascalCase
      `${this.baseUrl}/Collection/GetKurtaSet`, // With Get prefix
      `${this.baseUrl}/collection/kurta-set`, // lowercase controller
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        console.log(`[CollectionService] Calling API: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && (errorDetails.includes('object cycle') || errorDetails.includes('circular'))) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Kurta Set products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed for Kurta Set products');
  }

  /**
   * Get Dress products
   * Calls API: GET Collection/GetDress() or Collection/Dress
   * Matches CollectionController.Dress()
   */
  async getDressProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/dress`, // User's working endpoint (lowercase action)
      `${this.baseUrl}/Collection/Dress`, // Capitalized action
      `${this.baseUrl}/Collection/GetDress`, // With Get prefix
      `${this.baseUrl}/collection/dress`, // lowercase controller
    ];
debugger;
    let lastError: any = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && (errorDetails.includes('object cycle') || errorDetails.includes('circular'))) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Dress products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed for Dress products');
  }

  /**
   * Get Co-Ord Set products
   * Calls API: GET Collection/GetCoOrdSet() or Collection/co-ord-set
   * Matches CollectionController.CoOrdSet()
   */
  async getCoOrdSetProducts(): Promise<Product[]> {
    // Try multiple endpoint patterns - prioritize lowercase hyphenated as user mentioned it works
    const endpoints = [
      `${this.baseUrl}/Collection/co-ord-set`, // User's working endpoint (lowercase hyphenated)
      `${this.baseUrl}/Collection/CoOrdSet`, // PascalCase
      `${this.baseUrl}/Collection/GetCoOrdSet`, // With Get prefix
      `${this.baseUrl}/collection/co-ord-set`, // lowercase controller
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        console.log(`[CollectionService] Calling API: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Handle CORS
          mode: 'cors',
          credentials: 'omit',
          // Don't fail on self-signed certificates in development
          cache: 'no-cache',
        });

        console.log(`[CollectionService] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[CollectionService] API Response data:', data);
          return this.parseProductsResponse(data);
        } else {
          // Get error details from response
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error(`[CollectionService] API Error Response (${response.status}):`, errorText);
            
            // Try to parse as JSON for structured error
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[CollectionService] Parsed error JSON:', errorJson);
            } catch {
              // Not JSON, use as text
            }
          } catch (e) {
            console.error('[CollectionService] Could not read error response:', e);
          }

          // For 500 errors, provide more detailed error message
          if (response.status === 500) {
            console.error(`[CollectionService] Server Error 500 from ${url}`);
            console.error(`[CollectionService] Full error response:`, errorDetails);
            
            // Check for circular reference error
            if (errorDetails && (errorDetails.includes('object cycle') || errorDetails.includes('circular'))) {
              lastError = new Error(
                `Server Error (500): Circular reference detected in API response. The backend needs to configure JSON serialization to handle circular references. Error: ${errorDetails.substring(0, 1000)}`
              );
            } else {
              lastError = new Error(
                `Server Error (500): The API server returned an error. ${errorDetails ? `Error details: ${errorDetails.substring(0, 500)}` : 'Check the API server logs for more information.'}`
              );
            }
          } else {
            lastError = new Error(
              `Failed to fetch Co-Ord Set products: ${response.status} ${response.statusText}. ${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}`
            );
          }
          
          // If it's the last endpoint, throw the error
          if (url === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      } catch (error: any) {
        console.error(`[CollectionService] Error with endpoint ${url}:`, error);
        lastError = error;
        
        // If it's a network error (CORS, SSL, etc.), try next endpoint
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          console.warn(`[CollectionService] Network error with ${url}, trying next endpoint...`);
          continue;
        }
        
        // If it's the last endpoint, throw the error
        if (url === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed for Co-Ord Set products');
  }

  /**
   * Parse API response to extract products array
   * Handles different response formats and ensures encryptedId is available
   */
  private parseProductsResponse(data: any): Product[] {
    let products: Product[] = [];
    
    if (Array.isArray(data)) {
      products = data;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    } else {
      console.warn('Unexpected response format:', data);
      return [];
    }
    
    // Debug: Log first product to verify encryptedId
    if (products.length > 0) {
      console.log('[CollectionService] First product from API:', products[0]);
      console.log('[CollectionService] First product encryptedId:', products[0].encryptedId || (products[0] as any).EncryptedId);
    }
    
    // Ensure all products have encryptedId field (use it if available, otherwise keep as is)
    // Check both camelCase and PascalCase (in case JSON naming policy isn't applied)
    return products.map((product: Product) => {
      const encryptedId = product.encryptedId || (product as any).EncryptedId;
      if (!encryptedId) {
        console.warn('[CollectionService] Product missing encryptedId:', product.id, product.name);
      }
      return {
        ...product,
        encryptedId: encryptedId,
      };
    });
  }

  /**
   * Get products by collection slug
   * Maps slug to appropriate collection method
   */
  async getProductsBySlug(slug: string): Promise<Product[]> {
    const normalizedSlug = slug.toLowerCase();
    
    switch (normalizedSlug) {
      case 'kurta':
        return await this.getKurtaProducts();
      case 'top':
        return await this.getTopProducts();
      case 'kurti':
        return await this.getKurtiProducts();
      case 'kurta-set':
        return await this.getKurtaSetProducts();
      case 'dress':
        return await this.getDressProducts();
      case 'co-ord-set':
        return await this.getCoOrdSetProducts();
      default:
        throw new Error(`Unknown collection slug: ${slug}`);
    }
  }
}

export default new CollectionService();

