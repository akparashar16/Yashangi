/**
 * Product Detail Page
 * Public-facing product detail page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductService from '@/services/ProductService';
import CartService from '@/services/CartService';
import AuthService from '@/services/AuthService';
import { Product } from '@/models/Product';
import { getImageUrl } from '@/utils/imageUtils';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  // ID can be encrypted string or numeric string
  const productIdParam = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [sizeError, setSizeError] = useState<string>('');

  useEffect(() => {
    if (productIdParam) {
      loadProduct();
    }
  }, [productIdParam]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      // Always use encrypted ID for fetching product details
      // The ID from URL params should already be encrypted, but we'll use it as-is
      const data = await ProductService.getProductById(productIdParam);

      
      // Ensure we have encryptedId for future operations
      if (data && !data.encryptedId && data.id) {
        // If encryptedId is missing, the API should have provided it
        // Log a warning but continue with the data as-is
        console.warn('[ProductDetailPage] Product response missing encryptedId field. API may not be returning it.');
        console.warn('[ProductDetailPage] Full product object:', JSON.stringify(data, null, 2));
      }
      setProduct(data);
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      const isAuthenticated = AuthService.isAuthenticated();
      
      if (!isAuthenticated) {
        // Redirect to login with return URL
        router.push(`/account/login?returnUrl=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // Validate size selection if variants exist
      if (product.variants && product.variants.length > 0) {
        if (!size || size.trim() === '') {
          setSizeError('Please select a size before adding to cart');
          // Scroll to size selector
          setTimeout(() => {
            const sizeSelect = document.querySelector('select[value=""]');
            if (sizeSelect) {
              sizeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
              (sizeSelect as HTMLElement).focus();
            }
          }, 100);
          return;
        }
        setSizeError(''); // Clear error if size is selected
      }

      setAddingToCart(true);
      // Ensure size is always a string (default to empty string if undefined/null)
      const sizeValue = size || '';
      // Always use encryptedId for cart operations - it should be provided by the API
      const productId = product.encryptedId || product.id;
      if (!product.encryptedId) {
        console.warn('[ProductDetailPage] Product missing encryptedId for cart operation, using numeric id:', product.id);
      }
      await CartService.addToCart(productId, sizeValue, quantity);
      
      // Trigger cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Wait a bit for cart data to refresh, then open cart modal
      setTimeout(() => {
        const cartModal = document.getElementById('cart_modal');
        if (cartModal) {
          // Trigger another cart update to ensure data is fresh
          window.dispatchEvent(new Event('cartUpdated'));
          
          const bsModal = new (window as any).bootstrap.Modal(cartModal);
          bsModal.show();
        }
      }, 300); // Small delay to allow cart data to refresh
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error?.message || 'Failed to add item to cart. Please try again.';
      alert(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Product not found'}
        </div>
        <Link href="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    );
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const allImages = product.images && product.images.length > 0 ? product.images : [];
  const discountPercent = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const displayImage = allImages[selectedImageIndex] || primaryImage;

  return (
    <div className="container mt-4 mb-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/">Home</Link>
          </li>
          {product.categoryName && (
            <li className="breadcrumb-item">
              <Link href={`/collection/${product.categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                {product.categoryName}
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Product Images */}
        <div className="col-md-6">
          <div className="product-image-container mb-3">
            {displayImage ? (
              <img
                src={getImageUrl(displayImage.imagePath)}
                alt={product.name}
                className="img-fluid"
                style={{
                  width: '100%',
                  maxHeight: '600px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/images/placeholder.svg';
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}
              >
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {allImages.map((img, index) => (
                <img
                  key={img.id}
                  src={getImageUrl(img.imagePath)}
                  alt={`${product.name} - Image ${index + 1}`}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: selectedImageIndex === index ? '2px solid #fa5000' : '1px solid #dee2e6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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

        {/* Product Details */}
        <div className="col-md-6">
          <h1 className="mb-3">{product.name}</h1>
          
          {product.description && (
            <div className="mb-3">
              <p className="text-muted">{product.description}</p>
            </div>
          )}

          {/* Price Section */}
          <div className="mb-4">
            {discountPercent > 0 && (
              <div className="mb-2">
                <span className="badge bg-danger me-2">{discountPercent}% OFF</span>
              </div>
            )}
            <div className="d-flex align-items-baseline gap-3">
              <h3 className="text-primary mb-0">₹ {product.price.toFixed(2)}</h3>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="text-muted text-decoration-line-through">
                    ₹ {product.mrp.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-4">
            <table className="table table-borderless">
              <tbody>
                {product.sku && (
                  <tr>
                    <td><strong>SKU:</strong></td>
                    <td>{product.sku}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>Stock:</strong></td>
                  <td>
                    {product.stock > 0 ? (
                      <span className="text-success">In Stock ({product.stock} available)</span>
                    ) : (
                      <span className="text-danger">Out of Stock</span>
                    )}
                  </td>
                </tr>
                {product.categoryName && (
                  <tr>
                    <td><strong>Category:</strong></td>
                    <td>{product.categoryName}</td>
                  </tr>
                )}
                {product.subcategoryName && (
                  <tr>
                    <td><strong>Subcategory:</strong></td>
                    <td>{product.subcategoryName}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <label className="form-label"><strong>Size:</strong> <span className="text-danger">*</span></label>
              <select 
                className={`form-select ${sizeError ? 'is-invalid' : ''}`}
                style={{ maxWidth: '200px' }}
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  if (sizeError && e.target.value.trim() !== '') {
                    setSizeError(''); // Clear error when size is selected
                  }
                }}
              >
                <option value="">Select Size</option>
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.size || ''}>
                    {variant.size} {variant.stock > 0 ? `(₹${variant.price || product.price})` : ''}
                  </option>
                ))}
              </select>
              {sizeError && (
                <div className="invalid-feedback d-block">
                  {sizeError}
                </div>
              )}
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <label className="form-label mb-0"><strong>Quantity:</strong></label>
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  className="form-control text-center"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(val, product.stock)));
                  }}
                  min="1"
                  max={product.stock}
                  style={{ width: '80px', margin: '0 10px' }}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg w-100"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
            >
              {addingToCart ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Adding...
                </>
              ) : (
                <>
                  <i className="fa fa-cart-plus me-2"></i>
                  Add to Cart
                </>
              )}
            </button>

            {product.stock === 0 && (
              <div className="alert alert-warning mt-3 mb-0" role="alert">
                This product is currently out of stock.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
