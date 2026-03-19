/**
 * Product Card Component
 * Displays a single product in a card format matching ECommerce.Web design
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/models/Product';
import CartService from '@/services/CartService';
import AuthService from '@/services/AuthService';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const discountPercent = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const isAuthenticated = AuthService.isAuthenticated();
      
      if (!isAuthenticated) {
        // Redirect to login with return URL
        router.push(`/account/login?returnUrl=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // Ensure size is always a string (default to empty string)
      const sizeValue = '';
      // Always use encryptedId for cart operations - it should be provided by the API
      const productId = product.encryptedId || product.id;
      if (!product.encryptedId) {
        console.warn('[ProductCard] Product missing encryptedId for cart operation, using numeric id:', product.id);
      }
      await CartService.addToCart(productId, sizeValue, 1);
      
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
    }
  };

  // Always use encryptedId for URL - it should be provided by the API
  // Fallback to id only if encryptedId is not available (shouldn't happen with proper API)
  const productUrlId = product.encryptedId || product.id.toString();
  
  if (!product.encryptedId) {
    console.warn('[ProductCard] Product missing encryptedId, using numeric id:', product.id);
  }
  
  return (
    <div className="bsBox">
      <Link href={`/collection/details/${productUrlId}`}>
        <div className="product-item">
          <div className="product-img">
            {discountPercent > 0 && (
              <div className="offerdiscount">{discountPercent}% OFF</div>
            )}
            {primaryImage ? (
              <img
                src={getImageUrl(primaryImage.imagePath)}
                alt={product.name}
                style={{ objectFit: 'cover' }}
                className="img-thumbnail"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/images/placeholder.svg';
                }}
              />
            ) : (
              <img
                src="/assets/images/placeholder.svg"
                alt={product.name}
                style={{ objectFit: 'cover', width: '100%', height: '300px' }}
                className="img-thumbnail"
                loading="lazy"
              />
            )}
            <span className="add-to-cart" onClick={handleAddToCart}>
              <i className="fa fa-cart-plus"></i> <span>Add to cart</span>
            </span>
          </div>
          <div className="product-desc">
            <h3>{product.name}</h3>
            <p className="product-price">
              ₹ {product.price.toFixed(2)}
              {product.mrp && product.mrp > product.price && (
                <span> ₹ {product.mrp.toFixed(2)}</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

