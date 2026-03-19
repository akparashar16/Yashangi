/**
 * Admin Category Details Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';
import { Category } from '@/models/Category';

export default function AdminCategoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = parseInt(params.id as string);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/categories/${categoryId}`);
      return;
    }

    if (categoryId) {
      loadCategory();
    }
  }, [router, categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoryService.getCategoryById(categoryId);
      console.log('[CategoryDetailsPage] Category data:', data);
      setCategory(data);
    } catch (err: any) {
      console.error('Error loading category:', err);
      setError(err.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!category) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      const success = await CategoryService.deleteCategory(categoryId);
      if (success) {
        // Redirect to categories list after successful deletion
        router.push('/admin/categories');
      } else {
        setError('Category not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
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

  if (error || !category) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error || 'Category not found'}
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
            <i className="fas fa-file-lines" style={{ marginRight: '10px', color: '#28a745' }}></i>
            Category Details
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/admin/categories" style={{ color: '#666', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i> Back to Categories
          </Link>
          <Link href={`/admin/categories/${categoryId}/edit`} className="btn btn-primary">
            <i className="fas fa-edit"></i> Edit
          </Link>
          <button
            onClick={handleDeleteClick}
            className="btn btn-danger"
            disabled={deleting}
            style={{
              opacity: deleting ? 0.6 : 1,
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            <i className="fas fa-trash"></i> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div className="row">
            <div className="col-md-12">
              <h2 style={{ marginBottom: '20px' }}>{category.name}</h2>
              
             

              <div style={{ marginBottom: '20px' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  {category.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#fee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px',
                }}
              >
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '30px', color: '#dc3545' }}></i>
              </div>
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Category</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete <strong>"{category?.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#333',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  opacity: deleting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#dc3545',
                  color: '#fff',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: deleting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.background = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc3545';
                }}
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
