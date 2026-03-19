/**
 * Profit and Loss Report Page
 * Displays financial summary including revenue, costs, and profit
 */

'use client';

import React, { useEffect, useState } from 'react';
import AuthService from '@/services/AuthService';
import environment from '@/config/environment';

interface ProfitLossData {
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  period: {
    startDate: string;
    endDate: string;
  };
  monthlyBreakdown?: {
    month: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    netProfit: number;
  }[];
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    loadProfitLossData();
  }, [dateRange]);

  const loadProfitLossData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      const baseUrl = environment.api.baseUrl;
      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`${baseUrl}/Admin/profit-loss?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'omit',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profit and loss data: ${response.statusText}`);
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err: any) {
      console.error('Error loading profit and loss data:', err);
      setError(err.message || 'Failed to load profit and loss data');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[ProfitLossPage] Error extracting token:', error);
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0.00%';
    return `${((value / total) * 100).toFixed(2)}%`;
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
      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Date Range Filter */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h5 style={{ marginBottom: '15px' }}>Date Range</h5>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Start Date:</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              style={{ width: '200px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>End Date:</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              style={{ width: '200px' }}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={loadProfitLossData}
              style={{ marginTop: '20px' }}
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px', 
            marginBottom: '30px' 
          }}>
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(data.totalRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {data.totalOrders} orders
              </div>
            </div>

            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ef4444'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Cost of Goods Sold</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(data.totalCostOfGoodsSold)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {formatPercentage(data.totalCostOfGoodsSold, data.totalRevenue)} of revenue
              </div>
            </div>

            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Gross Profit</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(data.grossProfit)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {formatPercentage(data.grossProfit, data.totalRevenue)} margin
              </div>
            </div>

            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #f59e0b'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Net Profit</div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: data.netProfit >= 0 ? '#10b981' : '#ef4444'
              }}>
                {formatCurrency(data.netProfit)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {formatPercentage(data.netProfit, data.totalRevenue)} margin
              </div>
            </div>
          </div>

          {/* Profit and Loss Statement */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '8px', 
            padding: '25px', 
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ marginBottom: '20px', color: '#1f2937' }}>Profit and Loss Statement</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '15px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Revenue</div>
              <div style={{ fontWeight: 'bold', textAlign: 'right', color: '#1f2937' }}>
                {formatCurrency(data.totalRevenue)}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '15px',
              paddingLeft: '20px',
              marginBottom: '10px'
            }}>
              <div style={{ color: '#6b7280' }}>Cost of Goods Sold</div>
              <div style={{ textAlign: 'right', color: '#6b7280' }}>
                {formatCurrency(data.totalCostOfGoodsSold)}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '15px',
              borderTop: '1px solid #e5e7eb',
              borderBottom: '2px solid #e5e7eb',
              paddingTop: '15px',
              paddingBottom: '15px',
              marginTop: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#10b981' }}>Gross Profit</div>
              <div style={{ fontWeight: 'bold', textAlign: 'right', color: '#10b981' }}>
                {formatCurrency(data.grossProfit)}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '15px',
              paddingLeft: '20px',
              marginBottom: '10px'
            }}>
              <div style={{ color: '#6b7280' }}>Operating Expenses</div>
              <div style={{ textAlign: 'right', color: '#6b7280' }}>
                {formatCurrency(data.operatingExpenses)}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '15px',
              borderTop: '2px solid #e5e7eb',
              paddingTop: '15px',
              marginTop: '15px',
              backgroundColor: data.netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
              padding: '15px',
              borderRadius: '6px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '18px',
                color: data.netProfit >= 0 ? '#10b981' : '#ef4444'
              }}>
                Net Profit
              </div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '18px',
                textAlign: 'right',
                color: data.netProfit >= 0 ? '#10b981' : '#ef4444'
              }}>
                {formatCurrency(data.netProfit)}
              </div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '8px', 
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ marginBottom: '20px', color: '#1f2937' }}>Additional Statistics</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px' 
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Orders</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                  {data.totalOrders}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Items Sold</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                  {data.totalItemsSold}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Average Order Value</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(data.averageOrderValue)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Gross Profit Margin</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {formatPercentage(data.grossProfit, data.totalRevenue)}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown (if available) */}
          {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '25px', 
              marginTop: '30px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ marginBottom: '20px', color: '#1f2937' }}>Monthly Breakdown</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-striped" style={{ margin: 0 }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '12px' }}>Month</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>COGS</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Gross Profit</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyBreakdown.map((month, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px' }}>{month.month}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {formatCurrency(month.revenue)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {formatCurrency(month.costOfGoodsSold)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
                          {formatCurrency(month.grossProfit)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right',
                          color: month.netProfit >= 0 ? '#10b981' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(month.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
