/**
 * Admin Edit Category Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';
import { Category } from '@/models/Category';

export default function AdminEditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = parseInt(params.id as string);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/categories/${categoryId}/edit`);
      return;
    }

    if (categoryId) {
      loadCategory();
    }
  }, [router, categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategoryById(categoryId);
      console.log('[EditCategoryPage] Category data:', data);
      setCategory(data);
      
      // Populate form with category data
      setFormData({
        name: data.name || '',
        description: data.description || '',
      });
    } catch (err: any) {
      console.error('Error loading category:', err);
      setError(err.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Category name is required');
        setSaving(false);
        return;
      }

      // Update category
      const updatedCategory = await CategoryService.updateCategory(categoryId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      console.log('[EditCategoryPage] Category updated successfully:', updatedCategory);
      setSuccessMessage('Category updated successfully!');
      setError('');
      
      // Redirect to category details after a short delay to show success message
      setTimeout(() => {
        router.push(`/admin/categories/${categoryId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category. Please check all fields and try again.');
      setSuccessMessage('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/categories" className="btn btn-secondary">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            <i className="fas fa-edit" style={{ marginRight: '10px', color: '#17a2b8' }}></i>
            Edit Category
          </h1>
        </div>
        <Link href={`/admin/categories/${categoryId}`} style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Details
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter category name"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description (optional)"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href={`/admin/categories/${categoryId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
