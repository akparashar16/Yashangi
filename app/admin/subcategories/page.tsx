/**
 * Admin Subcategories List Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';
import { Subcategory } from '@/models/Category';

export default function AdminSubcategoriesPage() {
  const router = useRouter();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Authentication is handled by AdminLayout
    loadSubcategories();
  }, [router]);

  // Reload subcategories when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadSubcategories();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadSubcategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoryService.getAllSubcategories();
      setSubcategories(data);
    } catch (err: any) {
      console.error('Error loading subcategories:', err);
      setError(err.message || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number, subcategoryName: string) => {
    setSubcategoryToDelete({ id, name: subcategoryName });
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSubcategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!subcategoryToDelete) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      const success = await CategoryService.deleteSubcategory(subcategoryToDelete.id);
      if (success) {
        // Reload subcategories after delete
        await loadSubcategories();
      } else {
        setError('Subcategory not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting subcategory:', err);
      setError(err.message || 'Failed to delete subcategory. Please try again.');
    } finally {
      setDeleting(false);
      setSubcategoryToDelete(null);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(subcategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubcategories = subcategories.slice(startIndex, endIndex);

  // Reset to page 1 when subcategories change
  useEffect(() => {
    if (subcategories.length > 0 && currentPage > Math.ceil(subcategories.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [subcategories.length, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  return (
    <>
      {/* Action Buttons and Pagination Info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span className="text-muted">
            Showing {startIndex + 1} - {Math.min(endIndex, subcategories.length)} of {subcategories.length}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
            <span>Items per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <Link href="/admin/subcategories/create" style={{
          background: 'var(--admin-info-color)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--admin-primary-color)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--admin-info-color)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <i className="fas fa-plus"></i> Create New Subcategory
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <table className="table table-striped" style={{ margin: 0 }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Name</th>
              <th style={{ padding: '15px' }}>Category</th>
              <th style={{ padding: '15px' }}>Description</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubcategories.length > 0 ? (
              currentSubcategories.map((subcategory) => (
                <tr key={subcategory.id}>
                  <td style={{ padding: '15px' }}>{subcategory.id}</td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{subcategory.name}</td>
                  <td style={{ padding: '15px' }}>
                    {subcategory.categoryName || `Category ID: ${subcategory.categoryId}`}
                  </td>
                  <td style={{ padding: '15px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {subcategory.description || 'N/A'}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                      <Link
                        href={`/admin/subcategories/${subcategory.id}`}
                        className="btn btn-sm btn-success"
                        style={{
                          padding: '6px 12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                        }}
                        title="View Details"
                      >
                        <i className="fas fa-eye" style={{ fontSize: '14px' }}></i>
                        Details
                      </Link>
                      <Link
                        href={`/admin/subcategories/${subcategory.id}/edit`}
                        className="btn btn-sm btn-info"
                        style={{
                          padding: '6px 12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                        }}
                        title="Edit Subcategory"
                      >
                        <i className="fas fa-edit" style={{ fontSize: '14px' }}></i>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(subcategory.id, subcategory.name)}
                        className="btn btn-sm btn-danger"
                        style={{
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                          cursor: deleting ? 'not-allowed' : 'pointer',
                          opacity: deleting ? 0.6 : 1,
                        }}
                        title="Delete Subcategory"
                        disabled={deleting}
                      >
                        <i className="fas fa-trash" style={{ fontSize: '14px' }}></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                  No subcategories found.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {subcategories.length > 0 && (
          <div style={{ 
            background: '#ffffff',
            borderRadius: '8px',
            padding: '20px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="align-self-center">...</span>}
                </>
              )}

              {/* Page numbers around current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true; // Show all if 7 or fewer pages
                  return Math.abs(page - currentPage) <= 2;
                })
                .map(page => (
                  <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="align-self-center">...</span>}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>

            {/* Page Info */}
            <div className="text-muted" style={{ marginLeft: '10px' }}>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

      {/* Delete Subcategory Confirmation Modal */}
      {showDeleteModal && subcategoryToDelete && (
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
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Subcategory</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete <strong>"{subcategoryToDelete.name}"</strong>? This action cannot be undone.
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
    </>
  );
}
