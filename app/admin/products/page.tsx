/**
 * Admin Products List Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import ProductService from '@/services/ProductService';
import { Product } from '@/models/Product';
import { getImageUrl } from '@/utils/imageUtils';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string; encryptedId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Authentication is handled by AdminLayout
    loadProducts();
  }, [router]);

  // Reload products when window regains focus (e.g., after navigation back)
  useEffect(() => {
    const handleFocus = () => {
      loadProducts();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    // Use encryptedId if available, otherwise use id
    const productId = product.encryptedId || product.id;
    setProductToDelete({ id: product.id, encryptedId: product.encryptedId, name: product.name });
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      // Use encryptedId if available, otherwise use id
      const productIdToDelete = (productToDelete as any).encryptedId || productToDelete.id;
      const success = await ProductService.deleteProduct(productIdToDelete);
      if (success) {
        // Reload products after delete
        await loadProducts();
      } else {
        setError('Product not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
      setProductToDelete(null);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  // Reset to page 1 when products change
  useEffect(() => {
    if (products.length > 0 && currentPage > Math.ceil(products.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [products.length, itemsPerPage]);

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
            Showing {startIndex + 1} - {Math.min(endIndex, products.length)} of {products.length}
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
        <Link href="/admin/products/create" style={{
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
          <i className="fas fa-plus"></i> Create New Product
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
                <th style={{ padding: '15px' }}>Image</th>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Description</th>
                <th style={{ padding: '15px' }}>Price</th>
                <th style={{ padding: '15px' }}>Stock</th>
                <th style={{ padding: '15px' }}>SKU</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => {
                  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                  return (
                    <tr key={product.id}>
                      <td style={{ padding: '15px' }}>
                        {primaryImage ? (
                          <img
                            src={getImageUrl(primaryImage.imagePath)}
                            alt={product.name}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/images/placeholder.svg';
                            }}
                          />
                        ) : (
                          <span style={{ color: '#999' }}>No Image</span>
                        )}
                      </td>
                      <td style={{ padding: '15px' }}>{product.name}</td>
                      <td style={{ padding: '15px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description}
                      </td>
                      <td style={{ padding: '15px' }}>₹{product.price}</td>
                      <td style={{ padding: '15px' }}>{product.stock}</td>
                      <td style={{ padding: '15px' }}>{product.sku}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                          <Link
                            href={`/admin/products/${product.encryptedId || product.id}/edit`}
                            className="btn btn-sm btn-info"
                            style={{
                              padding: '6px 12px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '14px',
                            }}
                            title="Edit Product"
                          >
                            <i className="fas fa-edit" style={{ fontSize: '14px' }}></i>
                            Edit
                          </Link>
                          <Link
                            href={`/admin/products/${product.encryptedId || product.id}`}
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
                          <button
                            onClick={() => handleDeleteClick(product)}
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
                            title="Delete Product"
                            disabled={deleting}
                          >
                            <i className="fas fa-trash" style={{ fontSize: '14px' }}></i>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {products.length > 0 && (
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

      {/* Delete Product Confirmation Modal */}
      {showDeleteModal && productToDelete && (
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
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Product</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? This action cannot be undone.
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

