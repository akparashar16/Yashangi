/**
 * User Service
 * Handles user-related business logic and API calls for admin
 */

import { AdminUser } from '@/models/User';
import environment from '@/config/environment';
import AuthService from './AuthService';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified?: boolean;
  
}

export interface UpdateUserData {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified?: boolean;
}

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/AdminUsers`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<AdminUser> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/AdminUsers/${id}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<AdminUser> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/AdminUsers`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create user';
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
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: number, userData: UpdateUserData): Promise<AdminUser> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Ensure ID is included in the update data
      const updateData = {
        ...userData,
        id: id,
      };

      const response = await fetch(`${this.baseUrl}/AdminUsers/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        let errorMessage = 'Failed to update user';
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
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/AdminUsers/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        let errorMessage = 'Failed to delete user';
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
      console.error('Error deleting user:', error);
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
      console.error('[UserService] Error extracting token:', error);
      return null;
    }
  }
}

export default new UserService();
