/**
 * Admin Voucher Details Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';
import { Voucher } from '@/models/Voucher';

export default function AdminVoucherDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = parseInt(params.id as string);
  
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/vouchers/${voucherId}`);
      return;
    }

    if (voucherId) {
      loadVoucher();
    }
  }, [router, voucherId]);

  const loadVoucher = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VoucherService.getVoucherById(voucherId);
      setVoucher(data);
    } catch (err: any) {
      console.error('Error loading voucher:', err);
      setError(err.message || 'Failed to load voucher');
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
    if (!voucher) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      const success = await VoucherService.deleteVoucher(voucherId);
      if (success) {
        router.push('/admin/vouchers');
      } else {
        setError('Voucher not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting voucher:', err);
      setError(err.message || 'Failed to delete voucher. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const isActive = (voucher: Voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    return voucher.isActive && now >= startDate && now <= endDate;
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

  if (error || !voucher) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error || 'Voucher not found'}
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
            <i className="fas fa-file-lines" style={{ marginRight: '10px', color: '#28a745' }}></i>
            Voucher Details
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/admin/vouchers" style={{ color: '#666', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i> Back to Vouchers
          </Link>
          <Link href={`/admin/vouchers/${voucherId}/edit`} className="btn btn-primary">
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

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div className="row">
            <div className="col-md-12 mb-4">
              <h2 style={{ marginBottom: '20px' }}>
                <code style={{ background: '#f0f0f0', padding: '8px 16px', borderRadius: '4px', fontSize: '24px' }}>
                  {voucher.code}
                </code>
              </h2>
              
              <div style={{ marginBottom: '15px' }}>
                <span className={`badge ${isActive(voucher) ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '14px', padding: '8px 16px' }}>
                  {isActive(voucher) ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <strong>Discount Type:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {voucher.discountType === 'Percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
              </p>
            </div>

            <div className="col-md-6 mb-3">
              <strong>Discount Value:</strong>
              <p style={{ marginTop: '5px', color: '#666', fontSize: '18px', fontWeight: 600 }}>
                {voucher.discountType === 'Percentage' 
                  ? `${voucher.discountValue}%`
                  : `₹${voucher.discountValue.toFixed(2)}`}
              </p>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <strong>Start Date:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {formatDate(voucher.startDate)}
              </p>
            </div>

            <div className="col-md-6 mb-3">
              <strong>End Date:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {formatDate(voucher.endDate)}
              </p>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <strong>Minimum Purchase Amount:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {voucher.minimumPurchaseAmount ? `₹${voucher.minimumPurchaseAmount.toFixed(2)}` : 'No minimum'}
              </p>
            </div>

            {voucher.discountType === 'Percentage' && (
              <div className="col-md-6 mb-3">
                <strong>Maximum Discount Amount:</strong>
                <p style={{ marginTop: '5px', color: '#666' }}>
                  {voucher.maximumDiscountAmount ? `₹${voucher.maximumDiscountAmount.toFixed(2)}` : 'No maximum'}
                </p>
              </div>
            )}
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <strong>Usage Limit:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {voucher.usageLimit ? voucher.usageLimit : 'Unlimited'}
              </p>
            </div>

            <div className="col-md-6 mb-3">
              <strong>Used Count:</strong>
              <p style={{ marginTop: '5px', color: '#666' }}>
                {voucher.usedCount || 0}
              </p>
            </div>
          </div>

          {voucher.description && (
            <div className="row">
              <div className="col-md-12 mb-3">
                <strong>Description:</strong>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  {voucher.description}
                </p>
              </div>
            </div>
          )}

          {voucher.createdAt && (
            <div className="row">
              <div className="col-md-12 mb-3">
                <strong>Created At:</strong>
                <p style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
                  {formatDate(voucher.createdAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <h4 style={{ margin: '0 0 10px', color: '#333', fontWeight: 600 }}>Delete Voucher</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Are you sure you want to delete voucher <strong>"{voucher?.code}"</strong>? This action cannot be undone.
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
