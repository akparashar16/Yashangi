/**
 * Admin Dashboard Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import environment from '@/config/environment';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${environment.api.baseUrl}/Admin/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'omit',
          cache: 'no-cache',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
        }

        const data = await response.json();
        setStats({
          totalProducts: data.totalProducts ?? data.TotalProducts ?? 0,
          totalCategories: data.totalCategories ?? data.TotalCategories ?? 0,
          totalOrders: data.totalOrders ?? data.TotalOrders ?? 0,
          totalUsers: data.totalUsers ?? data.TotalUsers ?? 0,
        });
      } catch (error) {
        console.error('[AdminDashboardPage] Error loading dashboard stats:', error);
      }
    };

    loadDashboardStats();
  }, []);

  const getToken = (): string | null => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) return token;

      const authResponse = AuthService.getCurrentUser();
      if (authResponse?.token) {
        return authResponse.token;
      }

      return null;
    } catch (error) {
      console.error('[AdminDashboardPage] Error extracting token:', error);
      return null;
    }
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="stats-grid">
        <Link href="/admin/products" className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-title">Total Products</div>
              <div className="stat-card-value">{stats.totalProducts}</div>
            </div>
            <div className="stat-card-icon">
              <i className="fas fa-box"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <i className="fas fa-arrow-up"></i>
            <span>All products in store</span>
          </div>
        </Link>

        <Link href="/admin/categories" className="stat-card success">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-title">Total Categories</div>
              <div className="stat-card-value">{stats.totalCategories}</div>
            </div>
            <div className="stat-card-icon">
              <i className="fas fa-tags"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <i className="fas fa-arrow-up"></i>
            <span>Product categories</span>
          </div>
        </Link>

        <Link href="/admin/orders" className="stat-card warning">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-title">Total Orders</div>
              <div className="stat-card-value">{stats.totalOrders}</div>
            </div>
            <div className="stat-card-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <i className="fas fa-arrow-up"></i>
            <span>All orders received</span>
          </div>
        </Link>

        <Link href="/admin/users" className="stat-card danger">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-title">Total Users</div>
              <div className="stat-card-value">{stats.totalUsers}</div>
            </div>
            <div className="stat-card-icon">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <i className="fas fa-arrow-up"></i>
            <span>Registered users</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">
          <i className="fas fa-bolt"></i>
          Quick Actions
        </h3>
        <div className="actions-grid">
          <Link href="/admin/products/create" className="action-btn">
            <i className="fas fa-plus-circle"></i>
            <span>Add New Product</span>
          </Link>

          <Link href="/admin/categories/create" className="action-btn">
            <i className="fas fa-folder-plus"></i>
            <span>Add Category</span>
          </Link>

          <Link href="/admin/products" className="action-btn">
            <i className="fas fa-edit"></i>
            <span>Manage Products</span>
          </Link>

          <Link href="/admin/categories" className="action-btn">
            <i className="fas fa-list"></i>
            <span>Manage Categories</span>
          </Link>

          <Link href="/admin/orders" className="action-btn">
            <i className="fas fa-shopping-cart"></i>
            <span>Manage Orders</span>
          </Link>

          <Link href="/admin/users" className="action-btn">
            <i className="fas fa-users"></i>
            <span>Manage Users</span>
          </Link>

          <Link href="/admin/vouchers" className="action-btn">
            <i className="fas fa-ticket-alt"></i>
            <span>Manage Vouchers</span>
          </Link>

          <Link href="/admin/profit-loss" className="action-btn">
            <i className="fas fa-chart-line"></i>
            <span>Profit & Loss Report</span>
          </Link>
        </div>
      </div>
    </>
  );
}
