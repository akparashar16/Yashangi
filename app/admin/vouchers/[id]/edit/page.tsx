/**
 * Admin Edit Voucher Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';
import { Voucher } from '@/models/Voucher';

export default function AdminEditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = parseInt(params.id as string);
  
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
      router.push(`/admin/login?returnUrl=/admin/vouchers/${voucherId}/edit`);
      return;
    }

    if (voucherId) {
      loadVoucher();
    }
  }, [router, voucherId]);

  const loadVoucher = async () => {
    try {
      setLoading(true);
      const data = await VoucherService.getVoucherById(voucherId);
      console.log('[EditVoucherPage] Voucher data:', data);
      setVoucher(data);
      
      // Format dates for datetime-local input
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      setFormData({
        code: data.code || '',
        description: data.description || '',
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumPurchaseAmount: data.minimumPurchaseAmount || 0,
        maximumDiscountAmount: data.maximumDiscountAmount || 0,
        startDate: startDate.toISOString().slice(0, 16),
        endDate: endDate.toISOString().slice(0, 16),
        isActive: data.isActive,
        usageLimit: data.usageLimit || 0,
      });
    } catch (err: any) {
      console.error('Error loading voucher:', err);
      setError(err.message || 'Failed to load voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.code.trim()) {
        setError('Voucher code is required');
        setSaving(false);
        return;
      }

      if (formData.discountValue <= 0) {
        setError('Discount value must be greater than 0');
        setSaving(false);
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError('Start date and end date are required');
        setSaving(false);
        return;
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        setError('End date must be after start date');
        setSaving(false);
        return;
      }

      if (formData.discountType === 'Percentage' && formData.discountValue > 100) {
        setError('Percentage discount cannot exceed 100%');
        setSaving(false);
        return;
      }

      const updatedVoucher = await VoucherService.updateVoucher(voucherId, {
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
      
      console.log('[EditVoucherPage] Voucher updated successfully:', updatedVoucher);
      setSuccessMessage('Voucher updated successfully!');
      setError('');
      
      setTimeout(() => {
        router.push(`/admin/vouchers/${voucherId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating voucher:', err);
      setError(err.message || 'Failed to update voucher. Please check all fields and try again.');
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

  if (error && !voucher) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/vouchers" className="btn btn-secondary">
          Back to Vouchers
        </Link>
      </div>
    );
  }

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
            <i className="fas fa-edit" style={{ marginRight: '10px', color: '#17a2b8' }}></i>
            Edit Voucher
          </h1>
        </div>
        <Link href={`/admin/vouchers/${voucherId}`} style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Details
        </Link>
      </div>

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
                />
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
                />
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
                  />
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
                />
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
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href={`/admin/vouchers/${voucherId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
