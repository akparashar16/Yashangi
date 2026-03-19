/**
 * Category Service
 * Handles category-related business logic and API calls
 */

import { Category, Subcategory } from '@/models/Category';
import environment from '@/config/environment';
import AuthService from './AuthService';

class CategoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get all subcategories
   */
  async getAllSubcategories(): Promise<Subcategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/subcategories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  }

  /**
   * Get subcategories by category ID
   */
  async getSubcategoriesByCategory(categoryId: number): Promise<Subcategory[]> {
    try {
      // First try to get all subcategories and filter by categoryId
      const allSubcategories = await this.getAllSubcategories();
      return allSubcategories.filter(sub => sub.categoryId === categoryId);
    } catch (error) {
      console.error('Error fetching subcategories by category:', error);
      return [];
    }
  }

  /**
   * Get subcategory by ID
   */
  async getSubcategoryById(id: number): Promise<Subcategory> {
    try {
      const response = await fetch(`${this.baseUrl}/subcategories/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Subcategory not found');
        }
        throw new Error(`Failed to fetch subcategory: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }
  }

  /**
   * Create a new subcategory
   */
  async createSubcategory(subcategoryData: { name: string; categoryId: number; description?: string }): Promise<Subcategory> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/subcategories`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(subcategoryData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create subcategory';
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
      console.error('Error creating subcategory:', error);
      throw error;
    }
  }

  /**
   * Update an existing subcategory
   */
  async updateSubcategory(id: number, subcategoryData: { name: string; categoryId: number; description?: string }): Promise<Subcategory> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/subcategories/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(subcategoryData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Subcategory not found');
        }
        let errorMessage = 'Failed to update subcategory';
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
      console.error('Error updating subcategory:', error);
      throw error;
    }
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(id: number): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/subcategories/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete subcategory';
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
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<Category> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Category not found');
        }
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: { name: string; description?: string }): Promise<Category> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create category';
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
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: number, categoryData: { name: string; description?: string }): Promise<Category> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Category not found');
        }
        let errorMessage = 'Failed to update category';
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
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete category';
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
      console.error('Error deleting category:', error);
      throw error;
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
      console.error('[CategoryService] Error extracting token:', error);
      return null;
    }
  }
}

export default new CategoryService();

