/**
 * Admin Edit User Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import UserService from '@/services/UserService';
import { AdminUser } from '@/models/User';

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Customer',
    isEmailVerified: false,
  });

  useEffect(() => {
    // Check if user is authenticated and is Admin
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Admin') {
      router.push(`/admin/login?returnUrl=/admin/users/${userId}/edit`);
      return;
    }

    if (userId) {
      loadUser();
    }
  }, [router, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await UserService.getUserById(userId);
      console.log('[EditUserPage] User data:', data);
      setUser(data);
      
      // Populate form with user data (don't populate password)
      setFormData({
        email: data.email || '',
        password: '', // Don't populate password
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: data.role || 'Customer',
        isEmailVerified: data.isEmailVerified || false,
      });
    } catch (err: any) {
      console.error('Error loading user:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.email.trim()) {
        setError('Email is required');
        setSaving(false);
        return;
      }

      if (!formData.firstName.trim()) {
        setError('First name is required');
        setSaving(false);
        return;
      }

      if (!formData.lastName.trim()) {
        setError('Last name is required');
        setSaving(false);
        return;
      }

      // Prepare update data - only include password if it's provided
      const updateData: any = {
        id: userId,
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        isEmailVerified: formData.isEmailVerified,
      };

      // Only include password if it's provided and meets minimum length
      if (formData.password.trim() && formData.password.length >= 6) {
        updateData.password = formData.password;
      }

      // Update user
      const updatedUser = await UserService.updateUser(userId, updateData);
      
      console.log('[EditUserPage] User updated successfully:', updatedUser);
      setSuccessMessage('User updated successfully!');
      setError('');
      
      // Redirect to user details after a short delay to show success message
      setTimeout(() => {
        router.push(`/admin/users/${userId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please check all fields and try again.');
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

  if (error && !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link href="/admin/users" className="btn btn-secondary">
          Back to Users
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
            Edit User
          </h1>
        </div>
        <Link href={`/admin/users/${userId}`} style={{ color: '#666', textDecoration: 'none' }}>
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
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="firstName" className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  placeholder="Enter first name"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="lastName" className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
              <small className="form-text text-muted">Leave blank to keep current password. If provided, must be at least 6 characters long.</small>
            </div>

            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role *</label>
              <select
                className="form-select"
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="Customer">Customer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isEmailVerified"
                checked={formData.isEmailVerified}
                onChange={(e) => setFormData({ ...formData, isEmailVerified: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="isEmailVerified">
                Email Verified
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Link href={`/admin/users/${userId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
