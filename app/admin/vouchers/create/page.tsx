/**
 * Admin Create Voucher Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';

export default function AdminCreateVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'Percentage' as 'Percentage' | 'FixedAmount',
    discountValue: 0,
    minimumPurchaseAmount: 0,
    maximumDiscountAmount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 0,
  });

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push('/admin/login?returnUrl=/admin/vouchers/create');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.code.trim()) {
        setError('Voucher code is required');
        setLoading(false);
        return;
      }

      if (formData.discountValue <= 0) {
        setError('Discount value must be greater than 0');
        setLoading(false);
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError('Start date and end date are required');
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      if (formData.discountType === 'Percentage' && formData.discountValue > 100) {
        setError('Percentage discount cannot exceed 100%');
        setLoading(false);
        return;
      }

      // Create voucher
      const createdVoucher = await VoucherService.createVoucher({
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minimumPurchaseAmount: formData.minimumPurchaseAmount > 0 ? formData.minimumPurchaseAmount : undefined,
        maximumDiscountAmount: formData.maximumDiscountAmount > 0 ? formData.maximumDiscountAmount : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
      });
      
      console.log('[CreateVoucherPage] Voucher created:', createdVoucher);
      
      router.push('/admin/vouchers');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating voucher:', err);
      setError(err.message || 'Failed to create voucher. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
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
            Create Voucher
          </h1>
        </div>
        <Link href="/admin/vouchers" style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Vouchers
        </Link>
      </div>

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
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="code" className="form-label">Voucher Code *</label>
                <input
                  type="text"
                  className="form-control"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g., SAVE20"
                  maxLength={50}
                />
                <small className="form-text text-muted">Enter a unique voucher code (will be converted to uppercase)</small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="discountType" className="form-label">Discount Type *</label>
                <select
                  className="form-select"
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'Percentage' | 'FixedAmount' })}
                  required
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="FixedAmount">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="discountValue" className="form-label">Discount Value *</label>
                <input
                  type="number"
                  className="form-control"
                  id="discountValue"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  placeholder={formData.discountType === 'Percentage' ? 'e.g., 20' : 'e.g., 500'}
                />
                <small className="form-text text-muted">
                  {formData.discountType === 'Percentage' 
                    ? 'Enter percentage (0-100)' 
                    : 'Enter discount amount in ₹'}
                </small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="minimumPurchaseAmount" className="form-label">Minimum Purchase Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  id="minimumPurchaseAmount"
                  value={formData.minimumPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minimumPurchaseAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="0 (no minimum)"
                />
                <small className="form-text text-muted">Leave 0 for no minimum purchase requirement</small>
              </div>
            </div>

            {formData.discountType === 'Percentage' && (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="maximumDiscountAmount" className="form-label">Maximum Discount Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="maximumDiscountAmount"
                    value={formData.maximumDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    placeholder="0 (no maximum)"
                  />
                  <small className="form-text text-muted">Maximum discount cap for percentage vouchers (leave 0 for no limit)</small>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="startDate" className="form-label">Start Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="endDate" className="form-label">End Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="usageLimit" className="form-label">Usage Limit</label>
                <input
                  type="number"
                  className="form-control"
                  id="usageLimit"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="0 (unlimited)"
                />
                <small className="form-text text-muted">Maximum number of times this voucher can be used (0 = unlimited)</small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="isActive" className="form-label">Status</label>
                <div className="form-check form-switch" style={{ marginTop: '8px' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '3em', height: '1.5em', cursor: 'pointer' }}
                  />
                  <label className="form-check-label" htmlFor="isActive" style={{ marginLeft: '10px', cursor: 'pointer' }}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter voucher description (optional)"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href="/admin/vouchers" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
