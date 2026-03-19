/**
 * Category Model
 * Defines the structure for category data
 */

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  description?: string;
}

