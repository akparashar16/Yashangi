/**
 * Admin Create User Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import UserService from '@/services/UserService';

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      router.push('/admin/login?returnUrl=/admin/users/create');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      if (!formData.password.trim() || formData.password.length < 6) {
        setError('Password is required and must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (!formData.firstName.trim()) {
        setError('First name is required');
        setLoading(false);
        return;
      }

      if (!formData.lastName.trim()) {
        setError('Last name is required');
        setLoading(false);
        return;
      }

      // Create user
      const createdUser = await UserService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        isEmailVerified: formData.isEmailVerified,
      });
      
      
      // Redirect to users list on success
      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please check all fields and try again.');
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
            Create User
          </h1>
        </div>
        <Link href="/admin/users" style={{ color: '#666', textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> Back to Users
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
              <label htmlFor="password" className="form-label">Password *</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Enter password (minimum 6 characters)"
              />
              <small className="form-text text-muted">Password must be at least 6 characters long.</small>
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
              <Link href="/admin/users" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
