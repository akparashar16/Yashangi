/**
 * Image Utility Functions
 * Handles image path conversion and URL formatting
 */

import environment from '@/config/environment';

/**
 * Convert relative image path to full URL
 * Handles paths like /uploads/products/image.jpg or uploads/products/image.jpg
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return '/assets/images/placeholder.svg';
  }

  // If already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get server root URL (remove /api from base URL)
  // API base URL is like https://localhost:7195/api or http://localhost:7195/api
  const serverRoot = environment.api.baseUrl.replace('/api', '').replace(/\/$/, '');
  
  // If path starts with /, it's relative to the API server root
  if (imagePath.startsWith('/')) {
    return `${serverRoot}${imagePath}`;
  }

  // If path doesn't start with /, prepend server root and /
  return `${serverRoot}/${imagePath}`;
}

/**
 * Get placeholder image URL
 */
export function getPlaceholderImageUrl(): string {
  return '/assets/images/placeholder.svg';
}

