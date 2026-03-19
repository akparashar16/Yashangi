/**
 * Admin Login Page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthService from '@/services/AuthService';
import { LoginDto } from '@/models/User';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/admin';

  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redirect if already logged in as admin
    const currentUser = AuthService.getCurrentUser();
    if (currentUser && currentUser.role === 'Admin') {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authResponse = await AuthService.login(formData, returnUrl);
      
      // Check if user is Admin
      if (authResponse.role !== 'Admin') {
        // Logout non-admin users
        await AuthService.logout();
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      padding: '60px 0',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      <div style={{
        maxWidth: '450px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        padding: '50px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top border */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: 'linear-gradient(95.29deg, #1a1a2e -6.72%, #16213e 98.84%)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#1a1a2e',
            marginBottom: '10px',
            textTransform: 'capitalize',
          }}>
            Admin Portal
          </h2>
          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 10px 0' }}>
            Sign in to access admin dashboard
          </p>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(95.29deg, #1a1a2e -6.72%, #16213e 98.84%)',
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: '10px',
          }}>
            <i className="fa fa-shield-alt" style={{ marginRight: '6px' }}></i>
            Secure Access
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fff5f7',
            border: '1px solid #f29eb6',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '25px',
            color: '#e6116d',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <input
              type="email"
              className="form-control"
              placeholder=" "
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                fontSize: '14px',
                padding: '14px 16px',
                display: 'block',
                width: '100%',
                background: '#f7f7fc',
                color: '#333',
                height: '52px',
                border: '2px solid transparent',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a1a2e';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 4px rgba(26, 26, 46, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.background = '#f7f7fc';
                e.target.style.boxShadow = 'none';
              }}
            />
            <label style={{
              color: '#a9b1cb',
              fontSize: '14px',
              fontWeight: 500,
              position: 'absolute',
              pointerEvents: 'none',
              left: '16px',
              top: '16px',
              transition: 'all 0.3s ease',
              textTransform: 'capitalize',
            }}>
             
            </label>
          </div>

          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder=" "
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{
                fontSize: '14px',
                padding: '14px 16px',
                paddingRight: '50px',
                display: 'block',
                width: '100%',
                background: '#f7f7fc',
                color: '#333',
                height: '52px',
                border: '2px solid transparent',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a1a2e';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 4px rgba(26, 26, 46, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.background = '#f7f7fc';
                e.target.style.boxShadow = 'none';
              }}
            />
            <label style={{
              color: '#a9b1cb',
              fontSize: '14px',
              fontWeight: 500,
              position: 'absolute',
              pointerEvents: 'none',
              left: '16px',
              top: '16px',
              transition: 'all 0.3s ease',
              textTransform: 'capitalize',
            }}>
              
            </label>
            <button
              type="button"
              onClick={togglePassword}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#a9b1cb',
                cursor: 'pointer',
                fontSize: '18px',
                padding: 0,
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(95.29deg, #1a1a2e -6.72%, #16213e 98.84%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '16px',
              textTransform: 'uppercase',
              borderRadius: '30px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '10px',
              letterSpacing: '0.5px',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(26, 26, 46, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <i className="fa fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
            {loading ? 'Signing In...' : 'Admin Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          paddingTop: '25px',
          borderTop: '1px solid #f0f0f0',
        }}>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            <Link href="/" style={{
              color: '#1a1a2e',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              <i className="fa fa-arrow-left" style={{ marginRight: '6px' }}></i>
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

