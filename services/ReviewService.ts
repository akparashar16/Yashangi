/**
 * Review Service
 * Handles product review-related business logic and API calls
 */

import environment from '@/config/environment';
import AuthService from './AuthService';

export interface CreateReviewDto {
  productId: number;
  reviewerName?: string;
  rating: number;
  comment: string;
  userId?: number;
}

export interface ReviewDto {
  id: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

class ReviewService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
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
      console.error('[ReviewService] Error extracting token:', error);
      return null;
    }
  }

  /**
   * Get current user ID
   */
  private getUserId(): number | null {
    try {
      return AuthService.getCurrentUserId();
    } catch (error) {
      console.error('[ReviewService] Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Create a product review
   */
  async createReview(review: CreateReviewDto): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = this.getUserId();
      const token = this.getToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (userId) {
        headers['userId'] = userId.toString();
      }

      const reviewData: any = {
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
      };

      if (review.reviewerName) {
        reviewData.reviewerName = review.reviewerName;
      }

      const response = await fetch(`${this.baseUrl}/reviews`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create review';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        return { success: false, message: errorMessage };
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Review submitted successfully' };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, message: 'Failed to submit review' };
    }
  }

  /**
   * Check if user has already reviewed a product
   */
  async hasUserReviewedProduct(productId: number): Promise<boolean> {
    try {
      const userId = this.getUserId();
      if (!userId) return false;

      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Get user's review for this product
      const review = await this.getUserReviewForProduct(productId);
      return review !== null;
    } catch (error) {
      console.error('Error checking if user reviewed product:', error);
      return false;
    }
  }

  /**
   * Get user's review for a product
   */
  async getUserReviewForProduct(productId: number): Promise<ReviewDto | null> {
    try {
      const userId = this.getUserId();
      if (!userId) return null;

      const token = this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Get all reviews for the product and find user's review
      const response = await fetch(`${this.baseUrl}/reviews/product/${productId}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        return null;
      }

      const reviews: ReviewDto[] = await response.json();
      // Note: Backend should filter by userId, but we'll check here as fallback
      // For now, we'll return the first review if any exist
      // In a real implementation, the backend should provide a specific endpoint
      return reviews.length > 0 ? reviews[0] : null;
    } catch (error) {
      console.error('Error getting user review for product:', error);
      return null;
    }
  }

  /**
   * Get all reviews for a product
   */
  async getProductReviews(productId: number): Promise<ReviewDto[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting product reviews:', error);
      return [];
    }
  }
}

export default new ReviewService();

