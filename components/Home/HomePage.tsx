/**
 * Home Page Component
 * Complete home page with hero, categories, collections, and products
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/models/Product';
import ProductService from '@/services/ProductService';
import CollectionService from '@/services/CollectionService';
import ReviewService, { ReviewDto } from '@/services/ReviewService';
import ProductCard from '@/components/ProductCard';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    loadProducts(1, true);
    // Load reviews asynchronously without blocking page load
    loadReviews().catch(err => {
      console.error('Failed to load reviews (non-blocking):', err);
      // Don't set error state - just log it, page should still work
    });
  }, []);

  useEffect(() => {
    // Initialize Owl Carousel after scripts are loaded
    const initializeCarousels = () => {
    if (typeof window !== 'undefined' && (window as any).jQuery && (window as any).jQuery.fn.owlCarousel) {
      const $ = (window as any).jQuery;
      
        // Destroy existing carousels if they exist
        if ($('#catogry_slider').length && $('#catogry_slider').data('owlCarousel')) {
          $('#catogry_slider').trigger('destroy.owl.carousel');
        }
        if ($('#review_slider').length && $('#review_slider').data('owlCarousel')) {
          $('#review_slider').trigger('destroy.owl.carousel');
        }
        
        // Initialize category slider
        if ($('#catogry_slider').length) {
          $('#catogry_slider').owlCarousel({
            items: 4,
            itemsDesktop: [1199, 3],
            itemsDesktopSmall: [980, 2],
            itemsMobile: [400, 1],
            navigation: true,
            navigationText: false,
            autoPlay: true,
            loop: true,
            margin: 10
          });
        }
        
        // Initialize review slider only if reviews are loaded and element exists
        if ($('#review_slider').length && reviews && reviews.length > 0) {
          console.log('[HomePage] Initializing review slider with', reviews.length, 'reviews...');
          try {
            // Destroy existing carousel first
            if ($('#review_slider').data('owlCarousel')) {
              $('#review_slider').trigger('destroy.owl.carousel');
            }
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
              if ($('#review_slider').length && reviews.length > 0) {
                $('#review_slider').owlCarousel({
                  items: 1,
                  navigation: true,
                  autoPlay: reviews.length > 1,
                  autoPlayTimeout: 5000,
                  loop: reviews.length > 1,
                  margin: 10,
                  dots: reviews.length > 1,
                  nav: reviews.length > 1,
                  navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
                  responsive: {
                    0: { items: 1 },
                    768: { items: 1 },
                    992: { items: 1 }
                  }
                });
                console.log('[HomePage] Review slider initialized successfully');
              }
            }, 100);
          } catch (error) {
            console.error('[HomePage] Error initializing review slider:', error);
          }
        } else if ($('#review_slider').length && (!reviews || reviews.length === 0)) {
          console.log('[HomePage] Review slider element exists but no reviews to display');
        } else {
          console.warn('[HomePage] Review slider element not found');
        }
      }
    };

    // Try to initialize immediately
    if (typeof window !== 'undefined') {
      if ((window as any).jQuery && (window as any).jQuery.fn.owlCarousel) {
        // Wait a bit for DOM to be ready, especially for reviews section
        setTimeout(() => {
          initializeCarousels();
        }, 100);
      } else {
        // Wait for jQuery and Owl Carousel to load
        const checkInterval = setInterval(() => {
          if ((window as any).jQuery && (window as any).jQuery.fn.owlCarousel) {
            clearInterval(checkInterval);
            // Wait a bit for DOM to be ready
            setTimeout(() => {
              initializeCarousels();
            }, 100);
          }
        }, 100);

        // Clear interval after 5 seconds to avoid infinite checking
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && (window as any).jQuery) {
        const $ = (window as any).jQuery;
        if ($('#catogry_slider').length && $('#catogry_slider').data('owlCarousel')) {
          $('#catogry_slider').trigger('destroy.owl.carousel');
        }
        if ($('#review_slider').length && $('#review_slider').data('owlCarousel')) {
          $('#review_slider').trigger('destroy.owl.carousel');
        }
      }
    };
  }, [reviews]);

  const loadProducts = async (page: number = 1, isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
      setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      // Try to get products using multiple methods as fallback
      let productList: Product[] = [];
      let totalCount = 0;
      let hasMorePages = false;
      
      try {
        // First, try the paginated endpoint
        const pagedData = await ProductService.getProductsPaged(page, pageSize);
        if (pagedData && pagedData.items && Array.isArray(pagedData.items)) {
          productList = pagedData.items;
          totalCount = pagedData.totalCount || 0;
          hasMorePages = pagedData.hasNext || false;
          console.log('[HomePage] Loaded products from paginated endpoint:', productList.length, 'Page:', page);
        } else if (Array.isArray(pagedData)) {
          // Sometimes the API might return an array directly
          productList = pagedData.slice((page - 1) * pageSize, page * pageSize);
          totalCount = pagedData.length;
          hasMorePages = page * pageSize < pagedData.length;
          console.log('[HomePage] Loaded products from array response:', productList.length);
        }
      } catch (pagedError) {
        console.warn('[HomePage] Paginated endpoint failed, trying alternatives...', pagedError);
        
        // Fallback 1: Try getProducts() without pagination
        try {
          const allProducts = await ProductService.getProducts();
          if (Array.isArray(allProducts)) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            productList = allProducts.slice(startIndex, endIndex);
            totalCount = allProducts.length;
            hasMorePages = endIndex < allProducts.length;
            console.log('[HomePage] Loaded products from getProducts():', productList.length);
          }
        } catch (productsError) {
          console.warn('[HomePage] getProducts() failed, trying CollectionService...', productsError);
          
          // Fallback 2: Try getting Top products from CollectionService
          try {
            const topProducts = await CollectionService.getTopProducts();
            if (Array.isArray(topProducts)) {
              const startIndex = (page - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              productList = topProducts.slice(startIndex, endIndex);
              totalCount = topProducts.length;
              hasMorePages = endIndex < topProducts.length;
              console.log('[HomePage] Loaded products from CollectionService.getTopProducts():', productList.length);
            }
          } catch (topError) {
            console.error('[HomePage] All product loading methods failed:', topError);
            if (isInitialLoad) {
              setError('Unable to load products. Please check if the API is running.');
            }
          }
        }
      }
      
      if (isInitialLoad) {
        setProducts(productList);
      } else {
        // Append new products to existing list
        setProducts(prev => [...prev, ...productList]);
      }
      
      setTotalProducts(totalCount);
      setHasMore(hasMorePages);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('[HomePage] Error loading products:', error);
      if (isInitialLoad) {
        setError(error.message || 'Failed to load products. Please try again later.');
        setProducts([]);
      }
    } finally {
      if (isInitialLoad) {
      setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(currentPage + 1, false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      
      // Get all products first - handle errors gracefully
      let allProducts: Product[] = [];
      try {
        allProducts = await ProductService.getProducts();
      } catch (productError) {
        console.warn('Error loading products for reviews:', productError);
        // If products fail to load, we can't get reviews, so just set empty
        setReviews([]);
        setLoadingReviews(false);
        return;
      }
      
      // If no products, no reviews possible
      if (!allProducts || allProducts.length === 0) {
        setReviews([]);
        setLoadingReviews(false);
        return;
      }
      
      // Fetch reviews for multiple products and combine them
      const allReviews: ReviewDto[] = [];
      const productIds = allProducts.slice(0, 20).map(p => p.id); // Limit to first 20 products
      
      // Fetch reviews for each product
      for (const productId of productIds) {
        try {
          const productReviews = await ReviewService.getProductReviews(productId);
          
          if (productReviews && Array.isArray(productReviews) && productReviews.length > 0) {
            allReviews.push(...productReviews);
            
            // Stop if we have enough reviews (limit to 5 for home page)
            if (allReviews.length >= 5) {
              break;
            }
          }
        } catch (err) {
          // Silently continue to next product - don't log every failure
          // ReviewService already handles errors and returns empty array
          continue;
        }
      }
      
      // Shuffle and limit reviews to show variety (show 5 on home page)
      if (allReviews.length > 0) {
        const shuffled = allReviews.sort(() => 0.5 - Math.random());
        setReviews(shuffled.slice(0, 5)); // Show 5 reviews on home page
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Keep empty array - will show static reviews as fallback
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="starR">
        {[1, 2, 3, 4, 5].map((i) => (
          <a key={i} href="#" aria-label={`${i} star`}>
            <i className={`fa fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}></i>
          </a>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Hero Carousel */}
      <div className="hero_main">
        <div
          id="carouselExampleCaptions"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <ol className="carousel-indicators">
            <li
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="0"
              className="active"
            ></li>
            <li
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="1"
            ></li>
            <li
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="2"
            ></li>
          </ol>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <a href="#">
                <img
                  src="/assets/images/bannetr4.jpg"
                  className="d-block w-100"
                  alt="Banner 1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/images/banner-placeholder.svg';
                  }}
                />
              </a>
            </div>
            <div className="carousel-item">
              <a href="#">
                <img
                  src="/assets/images/banner2.jpg"
                  className="d-block w-100"
                  alt="Banner 3"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/images/banner-placeholder.svg';
                  }}
                />
              </a>
            </div>
          </div>
          <a
            className="carousel-control-prev"
            href="#carouselExampleCaptions"
            role="button"
            data-bs-slide="prev"
          >
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </a>
          <a
            className="carousel-control-next"
            href="#carouselExampleCaptions"
            role="button"
            data-bs-slide="next"
          >
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </a>
        </div>
      </div>

      {/* Category Slider */}
      <section className="cetogry_main">
        <div className="container">
          <div className="row mb-2">
            <div className="col-12">
              <h6>Shop by category</h6>
              <h2>Exclusive Deals</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div id="catogry_slider" className="owl-carousel">
                {/* Category items - you can make this dynamic */}
                <a href="/collection/kurta">
                  <div className="c_item_M">
                    <div className="image">
                      <img
                        src="/assets/images/StaticProduct/BlueKurta.jpg"
                        className="img-fluid"
                        alt="Kurtas"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/images/category-placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="inner_btnT">
                      <h3>Kurtas</h3>
                    </div>
                  </div>
                </a>
                <a href="/collection/kurta-set">
                  <div className="c_item_M">
                    <div className="image">
                      <img
                        src="/assets/images/StaticProduct/RamaSet.jpg"
                        className="img-fluid"
                        alt="Kurta Sets"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/images/category-placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="inner_btnT">
                      <h3>Kurta Sets</h3>
                    </div>
                  </div>
                </a>
                {/* Add more category items */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Grid */}
      <section className="catogry_grid">
        <div className="container">
          <div className="row mb-4">
            <div className="col-12 text-center">
              <h6>Shop by Occasion</h6>
              <h2>Styles for special events</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-6 col-lg-4 col-md-4 wsm100">
              <Link href="/collection/co-ord-set">
                <div className="big_destination">
                  <div className="image">
                    <img
                      src="/assets/images/StaticProduct/co-ord2.jpeg"
                      className="img-fluid"
                      alt="Co-Ord Set"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/category-placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="descriptiontxt">
                    <h3>Co-Ord Set</h3>
                    <span>View more</span>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-6 col-lg-4 col-md-4 wsm100">
              <Link href="/collection/kurta-set">
                <div className="big_destination">
                  <div className="image">
                    <img
                      src="/assets/images/StaticProduct/Pink001_6.jpeg"
                      className="img-fluid"
                      alt="Salwar Suits"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/category-placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="descriptiontxt">
                    <h3>Salwar Suits</h3>
                    <span>View more</span>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-6 col-lg-4 col-md-4 wsm100">
              <Link href="/collection/dress">
                <div className="big_destination sm12dv">
                  <div className="image">
                    <img
                      src="/assets/images/StaticProduct/dress.jpeg"
                      className="img-fluid"
                      alt="Dresses"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/category-placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="descriptiontxt">
                    <h3>Dresses</h3>
                    <span>View more</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="product_main pt-0">
        <div className="container">
          <div className="row mb-4">
            <div className="col-12 text-center">
              <h6>Products</h6>
              <h2>Latest Collection</h2>
            </div>
          </div>
          <div className="row">
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="col-12 text-center py-5">
                <p className="text-danger">{error}</p>
                <button 
                  className="btn btn-primary mt-3" 
                  onClick={() => loadProducts(1, true)}
                >
                  Try Again
                </button>
              </div>
            ) : products && products.length > 0 ? (
              <>
                {products.map((item) => (
                <div key={item.id} className="col-6 col-lg-3 col-md-3">
                  <ProductCard product={item} />
                </div>
                ))}
              </>
            ) : (
              <div className="col-12 text-center py-5">
                <p>No products found.</p>
                <button 
                  className="btn btn-primary mt-3" 
                  onClick={() => loadProducts(1, true)}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {!loading && !error && products.length > 0 && (
            <div className="row mt-4">
              <div className="col-12 text-center">
                {loadingMore ? (
                  <div className="py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading more products...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading more products...</p>
                  </div>
                ) : hasMore ? (
                  <button
                    className="btn btn-primary btn-lg px-5"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    <i className="fa fa-arrow-down me-2"></i>
                    Load More Products
                  </button>
                ) : (
                  <div className="py-3">
                    <p className="text-muted mb-0">
                      {totalProducts > 0 
                        ? `Showing all ${totalProducts} products` 
                        : 'No more products to load'}
                    </p>
                </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="review_main pt-0">
        <div className="container">
          <div className="row mb-2">
            <div className="col-12 text-center mb-3">
              <div className="section_title">
                <div className="qoteM">
                  <i className="fa fa-quote-left" aria-hidden="true"></i>
                </div>
                <h2>
                  What <span>People Say</span>
                </h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              {loadingReviews ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading reviews...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading customer reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div id="review_slider" className="owl-carousel" style={{ minHeight: '200px' }}>
                  {reviews.map((review, index) => (
                    <div key={review.id || index} className="review_item">
                      <div className="imgname">
                        <div className="image">
                          <img
                            src="/assets/images/avtar.png"
                            className="img-fluid"
                            alt={review.reviewerName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/images/avatar-placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="namestar">
                          <h4>{review.reviewerName}</h4>
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <div className="descR">
                        <p>{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div id="review_slider" className="owl-carousel" style={{ minHeight: '200px' }}>
                  {/* Fallback static reviews if no reviews found */}
                  <div className="review_item">
                    <div className="imgname">
                      <div className="image">
                        <img
                          src="/assets/images/avtar.png"
                          className="img-fluid"
                          alt="Customer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/images/avatar-placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="namestar">
                        <h4>Customer</h4>
                        {renderStars(5)}
                      </div>
                    </div>
                    <div className="descR">
                      <p>
                        We value your feedback! Be the first to review our products and help other customers make informed decisions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* More Reviews Button */}
              <div className="row mt-4">
                <div className="col-12 text-center">
                  <Link href="/reviews" className="btn btn-primary btn-lg px-5">
                    <i className="fa fa-star me-2"></i>
                    View More Reviews
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export default HomePage;

