/**
 * Admin Create Category Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';

export default function AdminCreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push('/admin/login?returnUrl=/admin/categories/create');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Category name is required');
        setLoading(false);
        return;
      }

      // Create category
      const createdCategory = await CategoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      
      // Redirect to categories list on success
      router.push('/admin/categories');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <i className="fas fa-plus-circle" style={{ marginRight: '10px', color: '#17a2b8' }}></i>
            Create Category
          </h1>
        </div>
        <Link href="/admin/categories" style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Categories
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
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
              <Link href="/admin/categories" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
