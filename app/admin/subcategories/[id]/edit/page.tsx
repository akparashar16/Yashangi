/**
 * Admin Edit Subcategory Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';
import { Subcategory, Category } from '@/models/Category';

export default function AdminEditSubcategoryPage() {
  const router = useRouter();
  const params = useParams();
  const subcategoryId = parseInt(params.id as string);
  
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  });

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/subcategories/${subcategoryId}/edit`);
      return;
    }

    if (subcategoryId) {
      loadData();
    }
  }, [router, subcategoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingCategories(true);
      
      // Load categories and subcategory in parallel
      const [categoriesData, subcategoryData] = await Promise.all([
        CategoryService.getAllCategories(),
        CategoryService.getSubcategoryById(subcategoryId),
      ]);
      
      console.log('[EditSubcategoryPage] Subcategory data:', subcategoryData);
      console.log('[EditSubcategoryPage] Categories data:', categoriesData);
      
      setCategories(categoriesData);
      setSubcategory(subcategoryData);
      
      // Populate form with subcategory data
      setFormData({
        name: subcategoryData.name || '',
        description: subcategoryData.description || '',
        categoryId: subcategoryData.categoryId?.toString() || '',
      });
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load subcategory');
    } finally {
      setLoading(false);
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Subcategory name is required');
        setSaving(false);
        return;
      }

      if (!formData.categoryId) {
        setError('Please select a category');
        setSaving(false);
        return;
      }

      // Update subcategory
      const updatedSubcategory = await CategoryService.updateSubcategory(subcategoryId, {
        name: formData.name.trim(),
        categoryId: parseInt(formData.categoryId),
        description: formData.description.trim() || undefined,
      });
      
      console.log('[EditSubcategoryPage] Subcategory updated successfully:', updatedSubcategory);
      setSuccessMessage('Subcategory updated successfully!');
      setError('');
      
      // Redirect to subcategory details after a short delay to show success message
      setTimeout(() => {
        router.push(`/admin/subcategories/${subcategoryId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating subcategory:', err);
      setError(err.message || 'Failed to update subcategory. Please check all fields and try again.');
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

  if (error && !subcategory) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/subcategories" className="btn btn-secondary">
          Back to Subcategories
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
            Edit Subcategory
          </h1>
        </div>
        <Link href={`/admin/subcategories/${subcategoryId}`} style={{ color: '#666', textDecoration: 'none' }}>
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
              <label htmlFor="categoryId" className="form-label">Category *</label>
              <select
                className="form-select"
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                disabled={loadingCategories}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {loadingCategories && (
                <small className="text-muted">Loading categories...</small>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="name" className="form-label">Subcategory Name *</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter subcategory name"
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
                placeholder="Enter subcategory description (optional)"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href={`/admin/subcategories/${subcategoryId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving || loadingCategories}>
                {saving ? 'Saving...' : 'Update Subcategory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
