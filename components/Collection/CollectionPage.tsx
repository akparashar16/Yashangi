/**
 * Collection Page Component
 * Displays products for a specific collection (category)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/models/Product';
import CollectionService from '@/services/CollectionService';
import ProductCard from '@/components/ProductCard';
import ImageWithFallback from '@/components/ImageWithFallback';

// Map collection slugs to category IDs
const COLLECTION_MAP: Record<string, { categoryId: number; title: string; bannerImage: string }> = {
  'kurta': { categoryId: 1, title: 'Kurtas', bannerImage: '/assets/images/Tussa.jpg' },
  'kurta-set': { categoryId: 4, title: 'Kurta Sets', bannerImage: '/assets/images/Tussa.jpg' },
  'kurti': { categoryId: 3, title: 'Kurti', bannerImage: '/assets/images/Tussa.jpg' },
  'top': { categoryId: 2, title: 'Top', bannerImage: '/assets/images/Tussa.jpg' },
  'dress': { categoryId: 5, title: 'Dress', bannerImage: '/assets/images/Tussa.jpg' },
  'co-ord-set': { categoryId: 6, title: 'Co-Ord Set', bannerImage: '/assets/images/Tussa.jpg' },
};

interface CollectionPageProps {
  slug: string;
}

const CollectionPage: React.FC<CollectionPageProps> = ({ slug }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionInfo = COLLECTION_MAP[slug.toLowerCase()];

  useEffect(() => {
    if (!collectionInfo) {
      setError('Collection not found');
      setLoading(false);
      return;
    }

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadProducts = async () => {
    if (!collectionInfo) return;

    try {
      setLoading(true);
      setError(null);
      
      // Use CollectionService to fetch products by slug (matches ECommerce.Web CollectionController)
      const data = await CollectionService.getProductsBySlug(slug);
      
      
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts([]);
        setError('No products found in this collection.');
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      const errorMessage = err.message || 'Failed to load products. Please check if the API is running.';
      setError(errorMessage);
      setProducts([]);
      
      // Log detailed error for debugging
      if (err.message && err.message.includes('500')) {
        console.error('Server Error (500): This usually means there is an error on the API server. Check:');
        console.error('1. Is the API server running?');
        console.error('2. Check the API server logs for the actual error');
        console.error('3. Verify the endpoint exists: Collection/GetKurta or Collection/Kurta');
        console.error('4. Check CORS configuration on the API server');
        
        // If it's a circular reference error, provide specific guidance
        if (err.message.includes('circular') || err.message.includes('object cycle')) {
          console.error('');
          console.error('⚠️ CIRCULAR REFERENCE ERROR DETECTED ⚠️');
          console.error('The API has a circular reference issue (Product → Category → Products → Category...).');
          console.error('Backend fix required: Add ReferenceHandler.IgnoreCycles to JsonSerializerOptions.');
          console.error('See BACKEND_FIX_REQUIRED.md for details.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!collectionInfo) {
    return (
      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center">
            <h1>Collection Not Found</h1>
            <p>The collection you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Inner Banner Section */}
      <section className="inner_banner">
        <ImageWithFallback
          src={collectionInfo.bannerImage}
          alt={collectionInfo.title}
          className="imgbanner"
          fallbackSrc="/assets/images/banner-placeholder.svg"
        />
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1>{collectionInfo.title}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="product_main pt-0">
        <div className="container-fluid">
          <div className="product_inner" style={{ padding: '15px 30px 0px 30px' }}>
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
                </div>
              ) : products.length > 0 ? (
                products.map((item) => (
                  <div key={item.id} className="col-6 col-lg-3 col-md-3">
                    <ProductCard product={item} />
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p>No products found in this collection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CollectionPage;

