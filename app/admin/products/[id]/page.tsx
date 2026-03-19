/**
 * Admin Product Details Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import ProductService from '@/services/ProductService';
import { Product } from '@/models/Product';
import { getImageUrl } from '@/utils/imageUtils';

export default function AdminProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  // ID can be encrypted string or numeric string
  const productIdParam = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/products/${productIdParam}`);
      return;
    }

    if (productIdParam) {
      loadProduct();
    }
  }, [router, productIdParam]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      // Always use encrypted ID for fetching product details
      const data = await ProductService.getProductById(productIdParam);
      // Ensure encryptedId is available
      if (data && !data.encryptedId) {
        console.warn('[ProductDetailsPage] Product response missing encryptedId field');
      }
      console.log('[ProductDetailsPage] Product data:', data);
      console.log('[ProductDetailsPage] Subcategory name:', data.subcategoryName || (data as any).subCategoryName || (data as any).SubCategoryName);
      console.log('[ProductDetailsPage] Variants:', data.variants || (data as any).Variants);
      setProduct(data);
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product');
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
    if (!product) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      // Use encryptedId if available, otherwise use the param
      const productIdToDelete = product?.encryptedId || productIdParam;
      const success = await ProductService.deleteProduct(productIdToDelete);
      if (success) {
        // Redirect to products list after successful deletion
        router.push('/admin/products');
      } else {
        setError('Product not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Handle keyboard navigation for image modal
  // This hook must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (selectedImageIndex === null || !product) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
      } else if (e.key === 'ArrowRight' && selectedImageIndex < (product.images?.length || 0) - 1) {
        setSelectedImageIndex(selectedImageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImageIndex, product]);

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

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error || 'Product not found'}
        </div>
        <Link href="/admin/products" className="btn btn-secondary">
          Back to Products
        </Link>
      </div>
    );
  }

  const primaryImage = product?.images?.find(img => img.isPrimary) || product?.images?.[0];
  const allImages = product?.images || [];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
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
            <i className="fas fa-file-lines" style={{ marginRight: '10px', color: '#28a745' }}></i>
            Product Details
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/admin/products" style={{ color: '#666', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i> Back to Products
          </Link>
          <Link href={`/admin/products/${productIdParam}/edit`} className="btn btn-primary">
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
        {successMessage && (
          <div className="alert alert-success" role="alert" style={{ marginBottom: '20px' }}>
            {successMessage}
          </div>
        )}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div className="row">
            <div className="col-md-4">
              {primaryImage ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={getImageUrl(primaryImage.imagePath)}
                    alt={product.name}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                    }}
                    onClick={() => {
                      const index = allImages.findIndex(img => img.id === primaryImage.id);
                      handleImageClick(index >= 0 ? index : 0);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/images/placeholder.svg';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <i className="fas fa-expand"></i> Click to enlarge
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}>
                  No Image Available
                </div>
              )}

              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.images.map((img, index) => (
                    <img
                      key={img.id}
                      src={getImageUrl(img.imagePath)}
                      alt={product.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: img.isPrimary ? '2px solid #17a2b8' : '1px solid #ddd',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      onClick={() => handleImageClick(index)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.border = '2px solid #17a2b8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.border = img.isPrimary ? '2px solid #17a2b8' : '1px solid #ddd';
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/placeholder.svg';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="col-md-8">
              <h2 style={{ marginBottom: '20px' }}>{product.name}</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '10px', color: '#666' }}>{product.description}</p>
              </div>

              <div className="row" style={{ marginBottom: '20px' }}>
                <div className="col-md-6">
                  <strong>Price:</strong> ₹{product.price}
                </div>
                <div className="col-md-6">
                  <strong>MRP:</strong> ₹{product.mrp}
                </div>
              </div>

              <div className="row" style={{ marginBottom: '20px' }}>
                <div className="col-md-6">
                  <strong>Stock:</strong> {product.stock}
                </div>
                <div className="col-md-6">
                  <strong>SKU:</strong> {product.sku || 'N/A'}
                </div>
              </div>

              <div className="row" style={{ marginBottom: '20px' }}>
                <div className="col-md-6">
                  <strong>Category:</strong> {product.categoryName || (product as any).CategoryName || 'N/A'}
                </div>
                <div className="col-md-6">
                  <strong>Subcategory:</strong> {product.subcategoryName || (product as any).subCategoryName || (product as any).SubCategoryName || 'N/A'}
                </div>
              </div>

              {/* Product Variants Section */}
              {(() => {
                // Handle both camelCase and PascalCase property names
                const productVariants = product.variants || (product as any).Variants || [];
                return productVariants.length > 0 ? (
                  <div style={{ marginBottom: '20px' }}>
                    <strong>Variants:</strong>
                    <table className="table table-sm" style={{ marginTop: '10px' }}>
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productVariants.map((variant: any, index: number) => (
                          <tr key={variant.id || index}>
                            <td>{variant.size || variant.Size || 'N/A'}</td>
                            <td>₹{variant.price || variant.Price || product.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && allImages[selectedImageIndex] && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Previous Button */}
            {allImages.length > 1 && selectedImageIndex > 0 && (
              <button
                onClick={handlePreviousImage}
                style={{
                  position: 'absolute',
                  left: '-60px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}

            {/* Image */}
            <img
              src={getImageUrl(allImages[selectedImageIndex].imagePath)}
              alt={product.name}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/images/placeholder.svg';
              }}
            />

            {/* Next Button */}
            {allImages.length > 1 && selectedImageIndex < allImages.length - 1 && (
              <button
                onClick={handleNextImage}
                style={{
                  position: 'absolute',
                  right: '-60px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                }}
              >
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
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
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Product</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete <strong>"{product?.name}"</strong>? This action cannot be undone.
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

