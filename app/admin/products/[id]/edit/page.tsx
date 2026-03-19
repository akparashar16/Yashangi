/**
 * Admin Edit Product Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import ProductService from '@/services/ProductService';
import CategoryService from '@/services/CategoryService';
import { Product } from '@/models/Product';
import { Category, Subcategory } from '@/models/Category';
import { getImageUrl } from '@/utils/imageUtils';

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  // ID can be encrypted string or numeric string
  const productIdParam = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ id: number; name: string } | null>(null);
  const [variants, setVariants] = useState<Array<{ size: string; price: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    costing: '',
    stock: '',
    sku: '',
    categoryId: '',
    subcategoryId: '',
  });

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/products/${productIdParam}/edit`);
      return;
    }

    if (productIdParam) {
      loadData();
    }
  }, [router, productIdParam]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Always use encrypted ID for fetching product details
      const [productData, categoriesData] = await Promise.all([
        ProductService.getProductById(productIdParam),
        CategoryService.getAllCategories(),
      ]);
      
      // Ensure encryptedId is available
      if (productData && !productData.encryptedId) {
        console.warn('[EditProductPage] Product response missing encryptedId field');
      }
      
      setProduct(productData);
      setCategories(categoriesData);
      
      // Populate form with product data
      // Handle both camelCase and PascalCase property names from backend
      const categoryId = (productData.categoryId || (productData as any).CategoryId)?.toString() || '';
      const subcategoryId = (productData.subcategoryId || (productData as any).subCategoryId || (productData as any).SubCategoryId)?.toString() || '';
      
      console.log('[EditProductPage] Product data:', productData);
      console.log('[EditProductPage] CategoryId:', categoryId);
      console.log('[EditProductPage] SubcategoryId:', subcategoryId);
      
      // Load subcategories first if category is selected
      const categoryIdNum = productData.categoryId || (productData as any).CategoryId;
      if (categoryIdNum) {
        await loadSubcategories(categoryIdNum);
      }
      
      // Set form data after subcategories are loaded to ensure proper binding
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        mrp: productData.mrp?.toString() || '',
        costing: productData.costing?.toString() || '',
        stock: productData.stock?.toString() || '',
        sku: productData.sku || '',
        categoryId,
        subcategoryId,
      });

      // Load variants from product data
      const productVariants = productData.variants || (productData as any).Variants || [];
      console.log('[EditProductPage] Product variants:', productVariants);
      if (productVariants.length > 0) {
        setVariants(productVariants.map((v: any) => ({
          size: v.size || v.Size || '',
          price: (v.price || v.Price || productData.price)?.toString() || '',
        })));
      } else {
        setVariants([]);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    try {
      setLoadingSubcategories(true);
      const data = await CategoryService.getSubcategoriesByCategory(categoryId);
      console.log('[EditProductPage] Loaded subcategories:', data);
      setSubcategories(data);
      
      // After subcategories are loaded, ensure the form data subcategoryId is still set
      if (product) {
        const subcategoryId = (product.subcategoryId || (product as any).subCategoryId || (product as any).SubCategoryId)?.toString() || '';
        if (subcategoryId) {
          setFormData(prev => ({ ...prev, subcategoryId }));
        }
      }
    } catch (err: any) {
      console.error('Error loading subcategories:', err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId, subcategoryId: '' }));
    if (categoryId) {
      loadSubcategories(parseInt(categoryId));
    } else {
      setSubcategories([]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(files);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: '', price: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'size' | 'price', value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const handleDeleteImageClick = (imageId: number) => {
    const image = product?.images?.find(img => img.id === imageId);
    if (image) {
      setImageToDelete({ id: imageId, name: image.imageName || `Image ${imageId}` });
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    try {
      setDeletingImageId(imageToDelete.id);
      setShowDeleteModal(false);
      // Use encryptedId for productId if available
      const productIdForImage = product?.encryptedId || productIdParam;
      const success = await ProductService.deleteProductImage(imageToDelete.id, productIdForImage);
      
      if (success) {
        // Reload product data to get updated images list
        const updatedProduct = await ProductService.getProductById(productIdParam);
        setProduct(updatedProduct);
        setSuccessMessage('Image deleted successfully!');
        setError('');
      } else {
        setError('Failed to delete image. Please try again.');
      }
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image. Please try again.');
    } finally {
      setDeletingImageId(null);
      setImageToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.mrp || !formData.costing || !formData.stock || !formData.categoryId) {
        setError('Please fill in all required fields');
        setSaving(false);
        return;
      }

      // Validate numeric fields
      const price = parseFloat(formData.price);
      const mrp = parseFloat(formData.mrp);
      const costing = parseFloat(formData.costing);
      const stock = parseInt(formData.stock);
      const categoryId = parseInt(formData.categoryId);
      const subcategoryId = formData.subcategoryId ? parseInt(formData.subcategoryId) : 0;

      if (isNaN(price) || isNaN(mrp) || isNaN(costing) || isNaN(stock) || isNaN(categoryId) || categoryId <= 0) {
        setError('Please enter valid numeric values for all required fields');
        setSaving(false);
        return;
      }

      // Prepare variants data
      const variantsData = variants
        .filter(v => v.size.trim() !== '')
        .map(v => ({
          size: v.size.trim(),
          price: parseFloat(v.price) || price,
        }));

      console.log('[EditProductPage] Variants state:', variants);
      console.log('[EditProductPage] Prepared variants data:', variantsData);

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: price,
        mrp: mrp,
        costing: costing,
        stock: stock,
        sku: formData.sku || '',
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        variants: variantsData,
      };

      console.log('[EditProductPage] Product data being sent:', productData);
      console.log('[EditProductPage] Variants in productData:', productData.variants);

      // Update product with new images (if any)
      // Use encryptedId if available, otherwise use the param
      const productIdToUpdate = product?.encryptedId || productIdParam;
      const updatedProduct = await ProductService.updateProduct(productIdToUpdate, productData, selectedImages.length > 0 ? selectedImages : undefined);
      
      console.log('[EditProductPage] Product updated successfully:', updatedProduct);
      setSuccessMessage('Product updated successfully!');
      setError('');
      
      // Redirect to product details after a short delay to show success message
      setTimeout(() => {
        router.push(`/admin/products/${productIdParam}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product. Please check all fields and try again.');
      setSuccessMessage('');
    } finally {
      setSaving(false);
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

  if (error && !product) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/products" className="btn btn-secondary">
          Back to Products
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
            <i className="fas fa-edit" style={{ marginRight: '10px', color: '#17a2b8' }}></i>
            Edit Product
          </h1>
        </div>
        <Link href={`/admin/products/${productIdParam}`} style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Details
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
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
              <label htmlFor="name" className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                className="form-control"
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label htmlFor="price" className="form-label">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="mrp" className="form-label">MRP *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  id="mrp"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="costing" className="form-label">Costing *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  id="costing"
                  value={formData.costing}
                  onChange={(e) => setFormData({ ...formData, costing: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="stock" className="form-label">Stock *</label>
                <input
                  type="number"
                  className="form-control"
                  id="stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="sku" className="form-label">SKU</label>
                <input
                  type="text"
                  className="form-control"
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="categoryId" className="form-label">Category *</label>
                <select
                  className="form-select"
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="subcategoryId" className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  id="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                  disabled={!formData.categoryId || loadingSubcategories}
                >
                  <option value="">
                    {loadingSubcategories 
                      ? 'Loading...' 
                      : !formData.categoryId 
                        ? 'Select a category first' 
                        : 'Select Subcategory'}
                  </option>
                  {subcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Variants */}
            <div className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0 }}>Product Variants (Size & Price)</label>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="btn btn-sm btn-outline-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <i className="fas fa-plus"></i> Add Variant
                </button>
              </div>
              {variants.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {variants.map((variant, index) => (
                    <div key={index} className="row mb-2" style={{
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      alignItems: 'center',
                    }}>
                      <div className="col-md-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Size (e.g., S, M, L, XL)"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        />
                      </div>
                      <div className="col-md-5">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm"
                          placeholder="Price"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="btn btn-sm btn-danger"
                          style={{ width: '100%' }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {variants.length === 0 && (
                <small className="form-text text-muted">
                  Add size variants for this product (e.g., S, M, L, XL) with different prices. Leave empty if product has no size variants.
                </small>
              )}
            </div>

            {product?.images && product.images.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Current Images</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.images.map((img) => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img
                        src={getImageUrl(img.imagePath)}
                        alt={product.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: img.isPrimary ? '2px solid #17a2b8' : '1px solid #ddd',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                      {img.isPrimary && (
                        <span style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#17a2b8',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                        }}>
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImageClick(img.id)}
                        disabled={deletingImageId === img.id}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: '5px',
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: deletingImageId === img.id ? 'not-allowed' : 'pointer',
                          opacity: deletingImageId === img.id ? 0.6 : 1,
                          fontSize: '14px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (deletingImageId !== img.id) {
                            e.currentTarget.style.background = '#c82333';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#dc3545';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Delete image"
                      >
                        {deletingImageId === img.id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-trash"></i>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="images" className="form-label">Add New Images</label>
              <input
                type="file"
                className="form-control"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              <small className="form-text text-muted">
                You can select multiple images to add. {selectedImages.length > 0 && `${selectedImages.length} new image(s) selected`}
              </small>
              {selectedImages.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedImages.map((file, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New Preview ${index + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href={`/admin/products/${productIdParam}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Image Confirmation Modal */}
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
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Image</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete this image? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
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
                disabled={deletingImageId !== null}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#dc3545',
                  color: '#fff',
                  cursor: deletingImageId !== null ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: deletingImageId !== null ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (deletingImageId === null) {
                    e.currentTarget.style.background = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc3545';
                }}
              >
                {deletingImageId !== null ? (
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

