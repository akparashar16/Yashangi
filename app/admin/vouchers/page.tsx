/**
 * Admin Vouchers List Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import VoucherService from '@/services/VoucherService';
import { Voucher } from '@/models/Voucher';

export default function AdminVouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<{ id: number; code: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadVouchers();
  }, [router]);

  useEffect(() => {
    const handleFocus = () => {
      loadVouchers();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VoucherService.getAllVouchers();
      setVouchers(data);
    } catch (err: any) {
      console.error('Error loading vouchers:', err);
      setError(err.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number, code: string) => {
    setVoucherToDelete({ id, code });
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setVoucherToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!voucherToDelete) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      setError(null);
      const success = await VoucherService.deleteVoucher(voucherToDelete.id);
      if (success) {
        await loadVouchers();
      } else {
        setError('Voucher not found or could not be deleted');
      }
    } catch (err: any) {
      console.error('Error deleting voucher:', err);
      setError(err.message || 'Failed to delete voucher. Please try again.');
    } finally {
      setDeleting(false);
      setVoucherToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

  const totalPages = Math.ceil(vouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVouchers = vouchers.slice(startIndex, endIndex);

  useEffect(() => {
    if (vouchers.length > 0 && currentPage > Math.ceil(vouchers.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [vouchers.length, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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

  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span className="text-muted">
            Showing {startIndex + 1} - {Math.min(endIndex, vouchers.length)} of {vouchers.length}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
            <span>Items per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <Link href="/admin/vouchers/create" style={{
          background: 'var(--admin-info-color)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--admin-primary-color)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--admin-info-color)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <i className="fas fa-plus"></i> Create New Voucher
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <table className="table table-striped" style={{ margin: 0 }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Code</th>
              <th style={{ padding: '15px' }}>Discount</th>
              <th style={{ padding: '15px' }}>Start Date</th>
              <th style={{ padding: '15px' }}>End Date</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVouchers.length > 0 ? (
              currentVouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td style={{ padding: '15px' }}>{voucher.id}</td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>
                    <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                      {voucher.code}
                    </code>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {voucher.discountType === 'Percentage' 
                      ? `${voucher.discountValue}%`
                      : `₹${voucher.discountValue}`}
                  </td>
                  <td style={{ padding: '15px' }}>{formatDate(voucher.startDate)}</td>
                  <td style={{ padding: '15px' }}>{formatDate(voucher.endDate)}</td>
                  <td style={{ padding: '15px' }}>
                    <span className={`badge ${isActive(voucher) ? 'bg-success' : 'bg-secondary'}`}>
                      {isActive(voucher) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                      <Link
                        href={`/admin/vouchers/${voucher.id}`}
                        className="btn btn-sm btn-success"
                        style={{
                          padding: '6px 12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                        }}
                        title="View Details"
                      >
                        <i className="fas fa-eye" style={{ fontSize: '14px' }}></i>
                        Details
                      </Link>
                      <Link
                        href={`/admin/vouchers/${voucher.id}/edit`}
                        className="btn btn-sm btn-info"
                        style={{
                          padding: '6px 12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                        }}
                        title="Edit Voucher"
                      >
                        <i className="fas fa-edit" style={{ fontSize: '14px' }}></i>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(voucher.id, voucher.code)}
                        className="btn btn-sm btn-danger"
                        style={{
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                          cursor: deleting ? 'not-allowed' : 'pointer',
                          opacity: deleting ? 0.6 : 1,
                        }}
                        title="Delete Voucher"
                        disabled={deleting}
                      >
                        <i className="fas fa-trash" style={{ fontSize: '14px' }}></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                  No vouchers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {vouchers.length > 0 && (
        <div style={{ 
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>

          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentPage > 3 && (
              <>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handlePageChange(1)}
                >
                  1
                </button>
                {currentPage > 4 && <span className="align-self-center">...</span>}
              </>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 7) return true;
                return Math.abs(page - currentPage) <= 2;
              })
              .map(page => (
                <button
                  key={page}
                  className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="align-self-center">...</span>}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>

          <div className="text-muted" style={{ marginLeft: '10px' }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {showDeleteModal && voucherToDelete && (
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
                Are you sure you want to delete voucher <strong>"{voucherToDelete.code}"</strong>? This action cannot be undone.
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
                  transition: 'all 0.2s ease',
                  opacity: deleting ? 0.6 : 1,
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
    </>
  );
}
