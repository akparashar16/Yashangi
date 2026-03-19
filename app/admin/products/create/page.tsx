/**
 * Admin Create Product Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import CategoryService from '@/services/CategoryService';
import ProductService from '@/services/ProductService';
import { Category, Subcategory } from '@/models/Category';

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
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
      router.push('/admin/login?returnUrl=/admin/products/create');
      return;
    }

    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId) {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
      return;
    }

    try {
      setLoadingSubcategories(true);
      const data = await CategoryService.getSubcategoriesByCategory(categoryId);
      setSubcategories(data);
      // Reset subcategory selection when category changes
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.mrp || !formData.costing || !formData.stock || !formData.categoryId) {
        setError('Please fill in all required fields');
        setLoading(false);
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
        setLoading(false);
        return;
      }

      // Prepare variants data
      const variantsData = variants
        .filter(v => v.size.trim() !== '')
        .map(v => ({
          size: v.size.trim(),
          price: parseFloat(v.price) || price,
        }));

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

      // Create product with images
      const createdProduct = await ProductService.createProduct(productData, selectedImages.length > 0 ? selectedImages : undefined);
      
      console.log('[CreateProductPage] Product created:', createdProduct);
      console.log('[CreateProductPage] Product images:', createdProduct.images);
      
      // Redirect to products list on success
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product. Please check all fields and try again.');
    } finally {
      setLoading(false);
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
            <i className="fas fa-plus-circle" style={{ marginRight: '10px', color: '#17a2b8' }}></i>
            Create Product
          </h1>
        </div>
        <Link href="/admin/products" style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Products
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
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

            <div className="mb-3">
              <label htmlFor="images" className="form-label">Product Images</label>
              <input
                type="file"
                className="form-control"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              <small className="form-text text-muted">
                You can select multiple images. {selectedImages.length > 0 && `${selectedImages.length} image(s) selected`}
              </small>
              {selectedImages.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedImages.map((file, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
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
              <Link href="/admin/products" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

