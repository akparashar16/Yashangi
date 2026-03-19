/**
 * Reviews Page
 * Displays all customer reviews with product images
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ReviewService, { ReviewDto } from '@/services/ReviewService';
import ProductService from '@/services/ProductService';
import { Product } from '@/models/Product';
import { getImageUrl } from '@/utils/imageUtils';

interface ReviewWithProduct extends ReviewDto {
  product?: Product;
}

interface ProductReviewsGroup {
  product: Product;
  reviews: ReviewWithProduct[];
  totalReviews: number;
  averageRating: number;
}

export default function ReviewsPage() {
  const [productReviewsGroups, setProductReviewsGroups] = useState<ProductReviewsGroup[]>([]);
  const [displayedGroups, setDisplayedGroups] = useState<ProductReviewsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 products per page
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    // Update displayed groups when productReviewsGroups or currentPage changes
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedGroups(productReviewsGroups.slice(startIndex, endIndex));
  }, [productReviewsGroups, currentPage, itemsPerPage]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');

      // Get all products first
      const allProducts = await ProductService.getProducts();
      
      if (!allProducts || allProducts.length === 0) {
        setProductReviewsGroups([]);
        setLoading(false);
        return;
      }
      
      // Group reviews by product
      const productGroupsMap = new Map<number, ProductReviewsGroup>();
      
      // Fetch reviews for each product
      for (const product of allProducts) {
        try {
          // Fetch full product details if images are not loaded
        let productWithImages = product;
          if (!product.images || product.images.length === 0) {
            try {
              const fullProduct = await ProductService.getProductById(product.id);
              if (fullProduct) {
                productWithImages = fullProduct;
              }
            } catch (err) {
              console.warn(`Failed to load full product details for ${product.id}:`, err);
            }
          }
          
          // Fetch reviews for this product
          const productReviews = await ReviewService.getProductReviews(product.id);
          
          if (productReviews && productReviews.length > 0) {
            // Add product info to each review
            const reviewsWithProduct: ReviewWithProduct[] = productReviews.map(review => ({
              ...review,
              product: productWithImages,
            }));
            
            // Calculate average rating
            const totalRating = reviewsWithProduct.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / reviewsWithProduct.length;
            
            productGroupsMap.set(product.id, {
              product: productWithImages,
              reviews: reviewsWithProduct,
              totalReviews: reviewsWithProduct.length,
              averageRating: averageRating,
            });
          }
        } catch (err) {
          console.warn(`Failed to load reviews for product ${product.id}:`, err);
          // Continue to next product
        }
      }
      
      // Convert map to array and sort by total reviews (products with more reviews first)
      const sortedGroups = Array.from(productGroupsMap.values()).sort((a, b) => {
        // Sort by total reviews (descending), then by average rating (descending)
        if (b.totalReviews !== a.totalReviews) {
          return b.totalReviews - a.totalReviews;
        }
        return b.averageRating - a.averageRating;
      });
      
      setProductReviewsGroups(sortedGroups);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Failed to load reviews. Please try again later.');
      setProductReviewsGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(productReviewsGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleProductReviews = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <i
            key={i}
            className={`fa fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}
            style={{ fontSize: '1.2rem' }}
          ></i>
        ))}
        <span className="ms-2 text-muted">({rating}/5)</span>
      </div>
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="logininner_main">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading reviews...</span>
            </div>
            <p className="mt-3 text-muted">Loading customer reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="carth2">Customer Reviews</h2>
                <p className="text-muted mb-0">
                  {productReviewsGroups.length > 0 
                    ? `${productReviewsGroups.length} ${productReviewsGroups.length === 1 ? 'product' : 'products'} with reviews • ${productReviewsGroups.reduce((sum, g) => sum + g.totalReviews, 0)} total ${productReviewsGroups.reduce((sum, g) => sum + g.totalReviews, 0) === 1 ? 'review' : 'reviews'}`
                    : 'No reviews yet'}
                </p>
              </div>
              <Link href="/" className="btn btn-outline-primary">
                <i className="fa fa-arrow-left me-2"></i>Back to Home
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={loadReviews}
            >
              <i className="fa fa-refresh me-1"></i>Retry
            </button>
          </div>
        )}

        {!error && productReviewsGroups.length === 0 && !loading && (
          <div className="alert alert-info text-center">
            <h4>No Reviews Yet</h4>
            <p>Be the first to review our products! Share your experience and help other customers.</p>
            <Link href="/" className="btn btn-primary">
              <i className="fa fa-shopping-bag me-2"></i>Start Shopping
            </Link>
          </div>
        )}

        {!error && displayedGroups.length > 0 && (
          <>
            <div className="row">
              {displayedGroups.map((group) => {
                const isExpanded = expandedProducts.has(group.product.id);
                const displayReviews = isExpanded ? group.reviews : group.reviews.slice(0, 3);
                const hasMoreReviews = group.reviews.length > 3;
                
                return (
                  <div key={group.product.id} className="col-12 mb-4">
                    <div className="card shadow-sm">
                      {/* Product Header */}
                      <div className="card-header bg-light">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="d-flex align-items-center">
                              {group.product.images && group.product.images.length > 0 ? (
                                <img
                                  src={getImageUrl(group.product.images[0].imagePath)}
                                  alt={group.product.name}
                                  className="img-thumbnail me-3"
                                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/assets/images/placeholder.svg';
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light d-flex align-items-center justify-content-center me-3"
                                  style={{ width: '100px', height: '100px' }}
                                >
                                  <i className="fa fa-image text-muted fa-2x"></i>
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <h5 className="mb-1 fw-bold">{group.product.name}</h5>
                                <div className="mb-2">
                                  {renderStars(Math.round(group.averageRating))}
                                  <span className="ms-2 text-muted">
                                    ({group.averageRating.toFixed(1)} / 5.0)
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                  <span className="badge bg-primary">
                                    <i className="fa fa-comments me-1"></i>
                                    {group.totalReviews} {group.totalReviews === 1 ? 'Review' : 'Reviews'}
                                  </span>
                                  <Link
                                    href={`/collection/details/${group.product.id}`}
                                    className="btn btn-outline-primary"
                                    style={{
                                      borderRadius: '12px',
                                      padding: '3px 10px',
                                      fontSize: '0.7rem',
                                      fontWeight: '500',
                                      transition: 'all 0.3s ease',
                                      borderWidth: '1px',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '3px',
                                      lineHeight: '1.2',
                                      whiteSpace: 'nowrap',
                                      width: '15%',
                                      minWidth: '100px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#0d6efd';
                                      e.currentTarget.style.color = '#fff';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(13, 110, 253, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#0d6efd';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <i className="fa fa-eye" style={{ fontSize: '0.65rem' }}></i>
                                    View Product
                                    <i className="fa fa-arrow-right" style={{ fontSize: '0.65rem' }}></i>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            {hasMoreReviews && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => toggleProductReviews(group.product.id)}
                              >
                                <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
                                {isExpanded ? 'Show Less' : `Show All ${group.totalReviews} Reviews`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reviews List */}
                      <div className="card-body">
                        <div className="row">
                          {displayReviews.map((review) => (
                            <div key={review.id} className="col-12 mb-3 pb-3 border-bottom">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">
                                    <i className="fa fa-user me-2 text-primary"></i>
                                    {review.reviewerName}
                                  </h6>
                                  {review.createdAt && (
                                    <small className="text-muted">
                                      <i className="fa fa-calendar me-1"></i>
                                      {formatDate(review.createdAt)}
                                    </small>
                                  )}
                                </div>
                                <div className="text-end">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <div className="review-comment mt-2">
                                <p className="mb-0" style={{ lineHeight: '1.6' }}>
                                  <i className="fa fa-quote-left me-2 text-muted"></i>
                                  {review.comment}
                                  <i className="fa fa-quote-right ms-2 text-muted"></i>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="text-muted">
                      Showing {startIndex + 1} - {Math.min(endIndex, productReviewsGroups.length)} of {productReviewsGroups.length} products
                    </div>
                    
                    <nav aria-label="Reviews pagination">
                      <ul className="pagination mb-0">
                        {/* Previous Button */}
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous"
                          >
                            <i className="fa fa-chevron-left"></i>
                          </button>
                        </li>

                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            if (totalPages <= 7) return true;
                            return (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            );
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsisBefore && (
                                  <li className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                )}
                                <li className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </button>
                                </li>
                              </React.Fragment>
                            );
                          })}

                        {/* Next Button */}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next"
                          >
                            <i className="fa fa-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>

                    {/* Page Info */}
                    <div className="text-muted">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Top Button */}
            {displayedGroups.length > 3 && (
              <div className="row mt-4">
                <div className="col-12 text-center">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <i className="fa fa-arrow-up me-2"></i>Back to Top
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
