/**
 * Auth Service
 * Handles authentication-related business logic and API calls matching ECommerce.Web
 */

import { LoginDto, RegisterDto, AuthResponse } from '@/models/User';
import environment from '@/config/environment';

class AuthService {
  private baseUrl: string;
  private readonly AUTH_KEY = 'authenticatedUser';

  constructor() {
    this.baseUrl = environment.api.baseUrl;
  }

  /**
   * Login user
   */
  async login(credentials: LoginDto, returnUrl?: string): Promise<AuthResponse> {
    try {
      // API expects JSON format, not FormData
      const response = await fetch(`${this.baseUrl}/account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // In Next.js, we'll handle redirects on the client side
      const data = await response.json();
      
      // Store auth response in sessionStorage (matching ASP.NET session)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterDto, returnUrl?: string): Promise<AuthResponse> {
    try {
      // API expects JSON format, not FormData
      const response = await fetch(`${this.baseUrl}/account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store auth response in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.AUTH_KEY);
        // Also call the logout endpoint
        await fetch(`${this.baseUrl}/account/logout`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Get current user from session
   */
  getCurrentUser(): AuthResponse | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const authJson = sessionStorage.getItem(this.AUTH_KEY);
      if (!authJson) {
        return null;
      }
      return JSON.parse(authJson);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!sessionStorage.getItem(this.AUTH_KEY);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.userId || null;
  }
}

export default new AuthService();

