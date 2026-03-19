/**
 * Admin Orders List Page
 * Displays all orders with successfully completed payments
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';
import OrderService from '@/services/OrderService';
import { OrderDetail } from '@/services/OrderService';
import environment from '@/config/environment';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelOrders, setLabelOrders] = useState<OrderDetail[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrders, setInvoiceOrders] = useState<OrderDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'Pending' | 'Packed' | 'ReadyForDispatch'>('all');

  useEffect(() => {
    // Authentication is handled by AdminLayout
    loadOrders();
  }, [router]);

  // Reload orders when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadOrders();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all orders with completed payments from AdminOrders API
      const token = getToken();
      const baseUrl = environment.api.baseUrl;
      const response = await fetch(`${baseUrl}/AdminOrders`, {
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
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[AdminOrdersPage] API Response:', data);
      console.log('[AdminOrdersPage] API Response Type:', typeof data);
      console.log('[AdminOrdersPage] API Response Keys:', Object.keys(data));

      // Handle different response formats
      let rawOrders: any[] = [];
      
      if (Array.isArray(data)) {
        rawOrders = data;
      } else if (data.orders && Array.isArray(data.orders)) {
        rawOrders = data.orders;
      } else if (data.data && Array.isArray(data.data)) {
        rawOrders = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        rawOrders = data.items;
      }

      console.log('[AdminOrdersPage] Raw Orders Count:', rawOrders.length);
      if (rawOrders.length > 0) {
        console.log('[AdminOrdersPage] First Order Sample:', JSON.stringify(rawOrders[0], null, 2));
      }

      // Normalize order data - handle CustomerOrderGroupDto format
      const normalizedOrders: OrderDetail[] = rawOrders.map((order: any) => {
        // Handle both camelCase and PascalCase property names
        const orderId = order.orderId || order.OrderId || '';
        const orderItems = order.orderItems || order.OrderItems || [];
        const customerInfo = order.customerInfo || order.CustomerInfo;
        const orderDate = order.orderDate || order.OrderDate || order.createdAt || order.CreatedAt;
        
        console.log('[AdminOrdersPage] Processing Order:', orderId);
        console.log('[AdminOrdersPage] Order Items (raw):', orderItems);
        console.log('[AdminOrdersPage] Order Items (type):', typeof orderItems, Array.isArray(orderItems));
        console.log('[AdminOrdersPage] Customer Info (raw):', customerInfo);
        console.log('[AdminOrdersPage] Customer Info Type:', typeof customerInfo);
        if (customerInfo) {
          console.log('[AdminOrdersPage] Customer Info Keys:', Object.keys(customerInfo));
          console.log('[AdminOrdersPage] Customer FirstName:', customerInfo.firstName || customerInfo.FirstName);
          console.log('[AdminOrdersPage] Customer LastName:', customerInfo.lastName || customerInfo.LastName);
          console.log('[AdminOrdersPage] Customer Email:', customerInfo.email || customerInfo.Email);
          console.log('[AdminOrdersPage] Customer Phone:', customerInfo.phone || customerInfo.Phone);
        }
        console.log('[AdminOrdersPage] Order Date (raw):', orderDate);
        console.log('[AdminOrdersPage] Full Order Object Keys:', Object.keys(order));
        
        // Extract customer name early for debugging
        const customerFirstName = customerInfo?.firstName || customerInfo?.FirstName || customerInfo?.first_name || customerInfo?.['firstName'] || customerInfo?.['FirstName'] || '';
        const customerLastName = customerInfo?.lastName || customerInfo?.LastName || customerInfo?.last_name || customerInfo?.['lastName'] || customerInfo?.['LastName'] || '';
        const customerEmail = customerInfo?.email || customerInfo?.Email || customerInfo?.['email'] || customerInfo?.['Email'] || '';
        const customerPhone = customerInfo?.phone || customerInfo?.Phone || customerInfo?.phoneNumber || customerInfo?.PhoneNumber || customerInfo?.['phone'] || customerInfo?.['Phone'] || '';
        
        console.log('[AdminOrdersPage] Extracted Customer Data:', {
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
          phone: customerPhone
        });
        
        const normalizedOrder: OrderDetail = {
          id: order.id || 0,
          orderId: orderId,
          userId: customerInfo?.userId || customerInfo?.UserId || 0,
          totalAmount: order.totalAmount || order.TotalAmount || 0,
          status: 'Completed',
          orderStatus: order.orderStatus || order.OrderStatus || order.status || order.Status || 'Pending',
          paymentStatus: order.paymentStatus || order.PaymentStatus || 'Completed',
          paymentMethod: 'PhonePe',
          createdAt: orderDate || order.createdAt || order.CreatedAt || order.orderDate || order.OrderDate || new Date().toISOString(),
          updatedAt: orderDate || order.updatedAt || order.UpdatedAt || order.orderDate || order.OrderDate || new Date().toISOString(),
          items: Array.isArray(orderItems) && orderItems.length > 0 ? orderItems.map((item: any) => {
            // Handle both camelCase and PascalCase for all properties
            const itemProductName = item.productName || item.ProductName || item.name || item.Name || 'Unknown Product';
            const itemQuantity = item.quantity || item.Quantity || item.qty || item.Qty || 1;
            const itemPrice = item.price || item.Price || item.unitPrice || item.UnitPrice || 0;
            
            return {
              id: item.id || item.Id || 0,
              orderId: item.orderId || item.OrderId || orderId,
              productId: item.productId || item.ProductId || 0,
              productName: itemProductName,
              productImage: item.productImageUrl || item.ProductImageUrl || item.productImage || item.ProductImage || item.imageUrl || item.ImageUrl || '',
              quantity: itemQuantity,
              price: itemPrice,
              lineTotal: item.lineTotal || item.LineTotal || item.total || item.Total || (itemPrice * itemQuantity),
              size: item.size || item.Size || item.productSize || item.ProductSize || '',
            };
          }) : [],
          shippingAddress: customerInfo ? {
            firstName: customerFirstName,
            lastName: customerLastName,
            email: customerEmail,
            phone: customerPhone,
            address: customerInfo.address || customerInfo.Address || customerInfo['address'] || customerInfo['Address'] || '',
            city: (customerInfo.city || customerInfo.City || customerInfo['city'] || customerInfo['City'])?.toString() || '',
            state: (customerInfo.state || customerInfo.State || customerInfo['state'] || customerInfo['State'])?.toString() || '',
            pincode: customerInfo.zipCode || customerInfo.ZipCode || customerInfo.pincode || customerInfo.Pincode || customerInfo.zip || customerInfo.Zip || customerInfo['zipCode'] || customerInfo['ZipCode'] || '',
            country: (customerInfo.country || customerInfo.Country || customerInfo['country'] || customerInfo['Country'])?.toString() || '1',
          } : undefined,
        };
        
        // Preserve customerInfo in the order object for fallback access
        (normalizedOrder as any).customerInfo = customerInfo;
        
        return normalizedOrder;
      });

      // Filter to ensure only completed payments (backend should already filter, but add safety check)
      const filteredOrders = normalizedOrders.filter(order => {
        const isPaid = order.paymentStatus === 'Success' || 
                      order.paymentStatus === 'Paid' ||
                      order.paymentStatus === 'Completed' ||
                      (!order.paymentStatus && order.items && order.items.length > 0);
        return isPaid;
      });

      console.log('[AdminOrdersPage] Loaded orders:', filteredOrders);
      setOrders(filteredOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
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
      console.error('[AdminOrdersPage] Error extracting token:', error);
      return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
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

  const getPaymentStatusBadgeClass = (status?: string) => {
    if (!status) return 'badge bg-secondary';
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning';
      case 'failed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all orders on current page
      const newSet = new Set(selectedOrders);
      currentOrders.forEach(order => newSet.add(order.orderId));
      setSelectedOrders(newSet);
    } else {
      // Deselect all orders on current page
      const newSet = new Set(selectedOrders);
      currentOrders.forEach(order => newSet.delete(order.orderId));
      setSelectedOrders(newSet);
    }
  };

  // Filter orders by status based on active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    return orders.filter(order => {
      const orderStatus = order.orderStatus || 'Pending';
      return orderStatus === activeTab;
    });
  }, [orders, activeTab]);

  // Pagination calculations based on filtered orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);
  
  // Selection calculations for current page
  const currentPageOrderIds = new Set(currentOrders.map(order => order.orderId));
  const isAllSelected = currentOrders.length > 0 && 
    currentPageOrderIds.size > 0 && 
    Array.from(currentPageOrderIds).every(id => selectedOrders.has(id));
  const isIndeterminate = Array.from(currentPageOrderIds).some(id => selectedOrders.has(id)) && 
    !Array.from(currentPageOrderIds).every(id => selectedOrders.has(id));

  // Reset to page 1 when orders or active tab changes
  useEffect(() => {
    if (filteredOrders.length > 0 && currentPage > Math.ceil(filteredOrders.length / itemsPerPage)) {
      setCurrentPage(1);
    } else if (filteredOrders.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, itemsPerPage, currentPage, activeTab]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateOrderStatus = async (orderIds: string[], newStatus: 'Pending' | 'Packed' | 'ReadyForDispatch') => {
    try {
      const token = getToken();
      const baseUrl = environment.api.baseUrl;

      console.log('[updateOrderStatus] Updating orders:', { orderIds, newStatus, baseUrl });

      // API controller exposes single-order status updates at:
      // PATCH /api/AdminOrders/{orderId}/status
      const updateResults = await Promise.allSettled(
        orderIds.map(async (orderId) => {
          const response = await fetch(`${baseUrl}/AdminOrders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'omit',
            body: JSON.stringify({ status: newStatus }),
          });

          const contentType = response.headers.get('content-type');
          let result: any = null;

          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          } else {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.ok || result?.success === false) {
            throw new Error(result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          return orderId;
        })
      );

      const successCount = updateResults.filter(result => result.status === 'fulfilled').length;
      const failMessages = updateResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Unknown error');

      if (successCount > 0) {
        await loadOrders();
        setSelectedOrders(new Set());
      }

      if (failMessages.length === 0) {
        alert(`Successfully updated ${successCount} order(s) to ${newStatus}`);
      } else {
        const uniqueErrors = Array.from(new Set(failMessages));
        alert(
          `Updated ${successCount} order(s), failed ${failMessages.length}.\n` +
          `Reason: ${uniqueErrors.join(' | ')}`
        );
      }
    } catch (err: any) {
      console.error('[updateOrderStatus] Error details:', err);
      const errorMessage = err.message || 'Failed to update order status. Please try again.';
      alert(errorMessage);
    }
  };

  const handleMarkAsPacked = () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to mark as packed.');
      return;
    }
    
    if (confirm(`Mark ${selectedOrders.size} selected order(s) as Packed?`)) {
      updateOrderStatus(Array.from(selectedOrders), 'Packed');
    }
  };

  const handleMarkAsReadyToDispatch = () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to mark as ready to dispatch.');
      return;
    }
    
    if (confirm(`Mark ${selectedOrders.size} selected order(s) as Ready for Dispatch?`)) {
      updateOrderStatus(Array.from(selectedOrders), 'ReadyForDispatch');
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleGenerateLabel = (orderId?: string) => {
    let ordersToLabel: OrderDetail[] = [];
    
    if (orderId) {
      // Generate label for single order
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        ordersToLabel = [order];
      }
    } else {
      // Generate labels for selected orders
      ordersToLabel = orders.filter(o => selectedOrders.has(o.orderId));
    }
    
    if (ordersToLabel.length > 0) {
      setLabelOrders(ordersToLabel);
      setShowLabelModal(true);
    } else {
      alert('Please select at least one order to generate a label.');
    }
  };

  const handlePrintLabels = () => {
    window.print();
  };

  const handleDownloadLabels = async () => {
    try {
      // Create a new window for printing/downloading
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download labels');
        return;
      }

      // Get label HTML content
      const labelContainer = document.querySelector('.label-print-container');
      if (!labelContainer) {
        alert('No labels found to download');
        return;
      }

      // Create HTML document for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Shipping Labels</title>
            <style>
              @page {
                size: A4;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: Arial, sans-serif;
                background: white;
              }
              .shipping-label {
                page-break-inside: avoid;
                page-break-after: always;
                margin-bottom: 15px;
                border: 2px solid #000;
                padding: 12px;
                width: 100%;
                max-width: 400px;
                font-size: 11px;
                line-height: 1.4;
                background: white;
              }
              .shipping-label:last-child {
                page-break-after: auto;
              }
              .shipping-label * {
                color: #000;
              }
            </style>
          </head>
          <body>
            ${labelContainer.innerHTML}
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print/save as PDF
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Note: User will need to choose "Save as PDF" in the print dialog
      }, 250);
    } catch (error) {
      console.error('Error downloading labels:', error);
      alert('Error downloading labels. Please try printing instead.');
    }
  };

  const handleCloseLabelModal = () => {
    setShowLabelModal(false);
    setLabelOrders([]);
  };

  const handleGenerateInvoice = (orderId?: string) => {
    let ordersToInvoice: OrderDetail[] = [];
    
    if (orderId) {
      // Generate invoice for single order
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        ordersToInvoice = [order];
      }
    } else {
      // Generate invoices for selected orders
      ordersToInvoice = orders.filter(o => selectedOrders.has(o.orderId));
    }
    
    if (ordersToInvoice.length > 0) {
      setInvoiceOrders(ordersToInvoice);
      setShowInvoiceModal(true);
    } else {
      alert('Please select at least one order to generate an invoice.');
    }
  };

  const generateInvoiceHTML = (ordersToInvoice: OrderDetail[]) => {
    const shipFromInfo = {
      companyName: 'Yashangi',
      address: '25, Moji vihar , Kalyanpura,Sanagner',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302020',
      phone: '+91-9376633049',
      email: 'info@yashangi.com'
    };

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch {
        return dateString;
      }
    };

    const invoicesHTML = ordersToInvoice.map((order, index) => {
      const customerName = order.shippingAddress 
        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
        : 'N/A';

      const itemsHTML = order.items && order.items.length > 0
        ? order.items.map((item, itemIndex) => {
            const productName = item.productName || 'N/A';
            const size = item.size || 'N/A';
            const quantity = item.quantity || 0;
            const price = (item.price || 0).toFixed(2);
            const lineTotal = (item.lineTotal || 0).toFixed(2);
            return `<tr>
              <td style="border: 1px solid #ddd; padding: 10px;">${productName}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${size}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${quantity}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${price}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${lineTotal}</td>
            </tr>`;
          }).join('')
        : '<tr><td colspan="5" style="border: 1px solid #ddd; padding: 10px; text-align: center;">No items</td></tr>';

      return `
        <div class="invoice" style="page-break-inside: avoid; page-break-after: ${index < ordersToInvoice.length - 1 ? 'always' : 'auto'}; margin-bottom: 20px; padding: 20px; border: 1px solid #ddd; background: white;">
          <!-- Invoice Header -->
          <div class="invoice-header" style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">INVOICE</h2>
                <div style="font-size: 12px; color: #666;">
                  <div><strong>Invoice #:</strong> ${order.orderId || 'N/A'}</div>
                  <div><strong>Date:</strong> ${order.createdAt ? formatDate(order.createdAt) : 'N/A'}</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${shipFromInfo.companyName}</div>
                <div style="font-size: 11px; color: #666;">
                  ${shipFromInfo.address ? `<div>${shipFromInfo.address}</div>` : ''}
                  <div>
                    ${shipFromInfo.city ? `${shipFromInfo.city}, ` : ''}
                    ${shipFromInfo.state ? `${shipFromInfo.state} ` : ''}
                    ${shipFromInfo.pincode ? `- ${shipFromInfo.pincode}` : ''}
                  </div>
                  ${shipFromInfo.phone ? `<div>Ph: ${shipFromInfo.phone}</div>` : ''}
                  ${shipFromInfo.email ? `<div>${shipFromInfo.email}</div>` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Body -->
          <div class="invoice-body" style="margin-bottom: 20px;">
            ${order.shippingAddress ? `
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Bill To:</h3>
                <div style="font-size: 12px; line-height: 1.6;">
                  <div style="font-weight: bold; margin-bottom: 5px;">${customerName !== 'N/A' ? customerName : 'N/A'}</div>
                  ${order.shippingAddress.address ? `<div>${order.shippingAddress.address}</div>` : ''}
                  <div>
                    ${order.shippingAddress.city ? `${order.shippingAddress.city}, ` : ''}
                    ${order.shippingAddress.state ? `${order.shippingAddress.state} ` : ''}
                    ${order.shippingAddress.pincode ? `- ${order.shippingAddress.pincode}` : ''}
                  </div>
                  ${order.shippingAddress.phone ? `<div style="margin-top: 5px;">Phone: ${order.shippingAddress.phone}</div>` : ''}
                  ${order.shippingAddress.email ? `<div>Email: ${order.shippingAddress.email}</div>` : ''}
                </div>
              </div>
            ` : ''}

            ${order.items && order.items.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Item</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Size</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Quantity</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Unit Price</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            ` : ''}
          </div>

          <!-- Invoice Footer -->
          <div class="invoice-footer" style="border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
            <div style="display: flex; justify-content: flex-end;">
              <div style="width: 300px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                  <span style="font-weight: bold;">Subtotal:</span>
                  <span>₹${(order.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                  <span style="font-weight: bold;">Tax:</span>
                  <span>₹0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px;">
                  <span>Total:</span>
                  <span>₹${(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center;">
              <div>Payment Status: <strong>${order.paymentStatus || 'Completed'}</strong></div>
              <div style="margin-top: 5px;">Thank you for your business!</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoices</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
            }
            .invoice {
              page-break-inside: avoid;
              margin-bottom: 20px;
              padding: 20px;
              border: 1px solid #ddd;
              background: white;
            }
            .invoice-header {
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .invoice-body {
              margin-bottom: 20px;
            }
            .invoice-footer {
              border-top: 2px solid #000;
              padding-top: 15px;
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            table th, table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${invoicesHTML}
        </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    try {
      // Get invoice HTML content from modal
      const invoiceContainer = document.querySelector('.invoice-print-container');
      if (!invoiceContainer) {
        alert('No invoices found to download');
        return;
      }

      // Create HTML document for PDF with all invoices in one file
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoices</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: white;
              }
              .invoice {
                page-break-inside: avoid;
                page-break-after: always;
                margin-bottom: 20px;
                padding: 20px;
                border: 1px solid #ddd;
                background: white;
              }
              .invoice:last-child {
                page-break-after: auto;
              }
              .invoice-header {
                border-bottom: 2px solid #000;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .invoice-body {
                margin-bottom: 20px;
              }
              .invoice-footer {
                border-top: 2px solid #000;
                padding-top: 15px;
                margin-top: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              table th, table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              table th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
            </style>
          </head>
          <body>
            ${invoiceContainer.innerHTML}
          </body>
        </html>
      `;

      // Create a new window for printing/downloading
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download invoices');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print/save as PDF
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Error downloading invoices:', error);
      alert('Error downloading invoices. Please try again.');
    }
  };

  const handleDownloadAllInvoices = async () => {
    try {
      if (selectedOrders.size === 0) {
        alert('Please select at least one order to download invoices.');
        return;
      }

      // Get selected orders
      const ordersToInvoice = orders.filter(o => selectedOrders.has(o.orderId));
      
      if (ordersToInvoice.length === 0) {
        alert('No orders selected for invoice generation.');
        return;
      }

      // Generate HTML for all invoices
      const htmlContent = generateInvoiceHTML(ordersToInvoice);

      // Create a new window for printing/downloading
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download invoices');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print/save as PDF
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Error downloading all invoices:', error);
      alert('Error downloading invoices. Please try again.');
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceOrders([]);
  };

  // Company/Seller Information for "Ship From"
  const shipFromInfo = {
    companyName: 'Yashangi',
    address: '25, Moji vihar , Kalyanpura,Sanagner',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302020',
    phone: '+91-9376633049',
    email: 'info@yashangi.com'
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

      {/* Status Filter Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <ul className="nav nav-tabs" role="tablist" style={{ borderBottom: '2px solid #dee2e6' }}>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '10px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === 'all' ? '2px solid #007bff' : '2px solid transparent',
                color: activeTab === 'all' ? '#007bff' : '#6c757d',
                fontWeight: activeTab === 'all' ? 'bold' : 'normal'
              }}
            >
              <i className="fas fa-list"></i> All Orders ({orders.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'Pending' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Pending'); setCurrentPage(1); }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '10px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === 'Pending' ? '2px solid #ffc107' : '2px solid transparent',
                color: activeTab === 'Pending' ? '#ffc107' : '#6c757d',
                fontWeight: activeTab === 'Pending' ? 'bold' : 'normal'
              }}
            >
              <i className="fas fa-clock"></i> Pending ({orders.filter(o => (o.orderStatus || 'Pending') === 'Pending').length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'Packed' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Packed'); setCurrentPage(1); }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '10px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === 'Packed' ? '2px solid #17a2b8' : '2px solid transparent',
                color: activeTab === 'Packed' ? '#17a2b8' : '#6c757d',
                fontWeight: activeTab === 'Packed' ? 'bold' : 'normal'
              }}
            >
              <i className="fas fa-box"></i> Packed ({orders.filter(o => (o.orderStatus || 'Pending') === 'Packed').length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'ReadyForDispatch' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ReadyForDispatch'); setCurrentPage(1); }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '10px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === 'ReadyForDispatch' ? '2px solid #28a745' : '2px solid transparent',
                color: activeTab === 'ReadyForDispatch' ? '#28a745' : '#6c757d',
                fontWeight: activeTab === 'ReadyForDispatch' ? 'bold' : 'normal'
              }}
            >
              <i className="fas fa-shipping-fast"></i> Ready for Dispatch ({orders.filter(o => (o.orderStatus || 'Pending') === 'ReadyForDispatch').length})
            </button>
          </li>
        </ul>
      </div>

      {filteredOrders.length > 0 && (
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>Total Orders: {filteredOrders.length}</strong>
            {selectedOrders.size > 0 && (
              <span className="ms-3 text-primary">
                <strong>{selectedOrders.size} selected</strong>
              </span>
            )}
            <span className="ms-3 text-muted">
              Showing {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedOrders.size > 0 && (
              <>
                {activeTab === 'Pending' && (
                  <button 
                    className="btn btn-sm btn-warning" 
                    onClick={handleMarkAsPacked}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fas fa-box"></i> Mark as Packed ({selectedOrders.size})
                  </button>
                )}
                {(activeTab === 'Pending' || activeTab === 'Packed') && (
                  <button 
                    className="btn btn-sm btn-success" 
                    onClick={handleMarkAsReadyToDispatch}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fas fa-shipping-fast"></i> Mark as Ready to Dispatch ({selectedOrders.size})
                  </button>
                )}
                <button className="btn btn-sm btn-info" onClick={() => handleGenerateLabel()} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fas fa-tag"></i> Generate Labels ({selectedOrders.size})
                </button>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => handleGenerateInvoice()}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <i className="fas fa-file-invoice"></i> Generate Invoices ({selectedOrders.size})
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleDownloadAllInvoices}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fas fa-download"></i> Download All Invoices ({selectedOrders.size})
                </button>
              </>
            )}
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
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleSelectAll(!isAllSelected)}
            >
              {isAllSelected ? 'Deselect Page' : 'Select Page'}
            </button>
          </div></div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {filteredOrders.length > 0 ? (
          <table className="table table-striped table-hover" style={{ margin: 0 }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ width: '50px', padding: '15px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '15px' }}>Order ID</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Customer</th>
                <th style={{ padding: '15px' }}>Email</th>
                <th style={{ padding: '15px' }}>Phone</th>
                <th style={{ padding: '15px' }}>Items</th>
                <th style={{ padding: '15px' }}>Total Amount</th>
                <th style={{ padding: '15px' }}>Order Status</th>
                <th style={{ padding: '15px' }}>Payment Status</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => {
                const isSelected = selectedOrders.has(order.orderId);
                const itemsCount = order.items?.length || 0;
                
                // Extract customer name with multiple fallback options
                let customerName = 'N/A';
                if (order.shippingAddress) {
                  const firstName = order.shippingAddress.firstName || '';
                  const lastName = order.shippingAddress.lastName || '';
                  customerName = `${firstName} ${lastName}`.trim();
                  
                  // If still empty, try to get from order object directly
                  if (!customerName || customerName === '') {
                    const directCustomerInfo = (order as any).customerInfo || (order as any).CustomerInfo;
                    if (directCustomerInfo) {
                      const directFirstName = directCustomerInfo.firstName || directCustomerInfo.FirstName || directCustomerInfo['firstName'] || directCustomerInfo['FirstName'] || '';
                      const directLastName = directCustomerInfo.lastName || directCustomerInfo.LastName || directCustomerInfo['lastName'] || directCustomerInfo['LastName'] || '';
                      customerName = `${directFirstName} ${directLastName}`.trim();
                    }
                  }
                } else {
                  // Try to get customer info directly from order object
                  const directCustomerInfo = (order as any).customerInfo || (order as any).CustomerInfo;
                  if (directCustomerInfo) {
                    const directFirstName = directCustomerInfo.firstName || directCustomerInfo.FirstName || directCustomerInfo['firstName'] || directCustomerInfo['FirstName'] || '';
                    const directLastName = directCustomerInfo.lastName || directCustomerInfo.LastName || directCustomerInfo['lastName'] || directCustomerInfo['LastName'] || '';
                    customerName = `${directFirstName} ${directLastName}`.trim();
                  }
                }
                
                if (!customerName || customerName === '') {
                  customerName = 'N/A';
                }
                
                // Debug logging for missing data
                if (!order.createdAt || customerName === 'N/A' || !order.shippingAddress?.email || itemsCount === 0) {
                  console.warn('[AdminOrdersPage] Order with missing data:', {
                    orderId: order.orderId,
                    createdAt: order.createdAt,
                    customerName,
                    email: order.shippingAddress?.email,
                    phone: order.shippingAddress?.phone,
                    itemsCount,
                    items: order.items,
                    shippingAddress: order.shippingAddress,
                    fullOrder: order
                  });
                }
                
                return (
                  <tr 
                    key={order.orderId}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e7f3ff' : undefined
                    }}
                    onClick={() => handleSelectOrder(order.orderId)}
                  >
                    <td style={{ padding: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOrder(order.orderId)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '15px', fontWeight: 500 }}>{order.orderId}</td>
                    <td style={{ padding: '15px' }}>{formatDate(order.createdAt)}</td>
                    <td style={{ padding: '15px' }}>{customerName}</td>
                    <td style={{ padding: '15px' }}>{order.shippingAddress?.email || 'N/A'}</td>
                    <td style={{ padding: '15px' }}>{order.shippingAddress?.phone || 'N/A'}</td>
                    <td style={{ padding: '15px' }}>
                      {itemsCount > 0 ? (
                        <span className="badge bg-info">{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ padding: '15px', fontWeight: 600 }}>₹{order.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '15px' }}>
                      <span className={`badge ${
                        (order.orderStatus || 'Pending') === 'Pending' ? 'bg-warning' :
                        (order.orderStatus || 'Pending') === 'Packed' ? 'bg-info' :
                        (order.orderStatus || 'Pending') === 'ReadyForDispatch' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {order.orderStatus || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span className={getPaymentStatusBadgeClass(order.paymentStatus)}>
                        {order.paymentStatus || 'Completed'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateLabel(order.orderId);
                          }}
                          title="Generate Label"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <i className="fas fa-tag"></i> Label
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateInvoice(order.orderId);
                          }}
                          title="Generate Invoice"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <i className="fas fa-file-invoice"></i> Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
            <i className="fas fa-shopping-cart" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
            <p>
              {activeTab === 'all' 
                ? 'No orders with completed payments found.' 
                : `No orders with status "${activeTab}" found.`}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <div style={{ 
            padding: '20px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* First page */}
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

              {/* Page numbers around current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true; // Show all if 7 or fewer pages
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

              {/* Last page */}
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

            {/* Page Info */}
            <div className="text-muted" style={{ marginLeft: '10px' }}>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Label Generation Modal */}
      {showLabelModal && labelOrders.length > 0 && (
        <>
          {/* Print Styles */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                size: A4;
                margin: 5mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                width: 100% !important;
                height: auto !important;
              }
              /* Hide everything by default */
              body > * {
                display: none !important;
                visibility: hidden !important;
              }
              /* Show only label container and its direct children */
              .label-print-container {
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                padding: 10px !important;
                margin: 0 !important;
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
                max-height: none !important;
                page-break-inside: auto !important;
              }
              .label-print-container,
              .label-print-container * {
                display: block !important;
                visibility: visible !important;
                color: #000 !important;
                background: transparent !important;
              }
              .label-print-container div {
                display: block !important;
                visibility: visible !important;
              }
              .label-print-container span,
              .label-print-container strong,
              .label-print-container p {
                display: inline !important;
                visibility: visible !important;
              }
              .no-print,
              .no-print *,
              div[style*="position: fixed"],
              div[style*="position:fixed"],
              div[style*="background: rgba"],
              div[style*="background-color: rgba"],
              div[style*="borderRadius"],
              div[style*="border-radius"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              .shipping-label {
                page-break-inside: avoid !important;
                page-break-after: always !important;
                margin-bottom: 15px !important;
                visibility: visible !important;
                display: block !important;
                width: 100% !important;
                max-width: 400px !important;
                border: 2px solid #000 !important;
                padding: 12px !important;
                background: white !important;
                color: #000 !important;
              }
              .shipping-label:last-child {
                page-break-after: auto !important;
              }
              .shipping-label * {
                visibility: visible !important;
                display: block !important;
                color: #000 !important;
                background: transparent !important;
              }
              .shipping-label div {
                display: block !important;
                visibility: visible !important;
              }
              .shipping-label span,
              .shipping-label strong {
                display: inline !important;
                visibility: visible !important;
              }
              /* Hide all other page elements */
              header, nav, footer, aside,
              .admin-layout, .admin-sidebar, .admin-header, .admin-main-content,
              table, .table, .card, .btn, .navbar {
                display: none !important;
                visibility: hidden !important;
              }
            }
            @media screen {
              .label-print-container {
                display: flex;
                flex-direction: column;
              }
            }
          `}} />

          {/* Modal Overlay */}
          <div
            className="no-print"
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
              padding: '20px',
            }}
            onClick={handleCloseLabelModal}
          >
            <div
              className="no-print"
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0 }}>Shipping Labels ({labelOrders.length})</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-success"
                    onClick={handleDownloadLabels}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fas fa-download"></i> Download PDF
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCloseLabelModal}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Label Preview */}
              <div className="label-print-container" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '10px'
              }}>
                {labelOrders.map((order, index) => {
                  const customerName = order.shippingAddress 
                    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
                    : 'N/A';
                  
                  return (
                    <div
                      key={order.orderId}
                      className="shipping-label"
                      style={{
                        border: '2px solid #000',
                        padding: '12px',
                        marginBottom: '15px',
                        width: '100%',
                        maxWidth: '400px',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '11px',
                        background: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        lineHeight: '1.4',
                      }}
                    >
                      {/* Label Header */}
                      <div style={{ borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                          SHIPPING LABEL
                        </div>
                        <div style={{ fontSize: '10px' }}>
                          Order ID: <strong>{order.orderId}</strong>
                        </div>
                        <div style={{ fontSize: '10px' }}>
                          Date: {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                        </div>
                      </div>

                      {/* Ship From Address */}
                      <div style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>SHIP FROM:</div>
                        <div style={{ lineHeight: '1.4', fontSize: '10px' }}>
                          <div style={{ fontWeight: 'bold' }}>{shipFromInfo.companyName}</div>
                          {shipFromInfo.address && (
                            <div>{shipFromInfo.address}</div>
                          )}
                          <div>
                            {shipFromInfo.city && `${shipFromInfo.city}, `}
                            {shipFromInfo.state && `${shipFromInfo.state} `}
                            {shipFromInfo.pincode && `- ${shipFromInfo.pincode}`}
                          </div>
                          {shipFromInfo.phone && (
                            <div style={{ marginTop: '2px' }}>
                              <strong>Ph:</strong> {shipFromInfo.phone}
                            </div>
                          )}
                          {shipFromInfo.email && (
                            <div>
                              <strong>Email:</strong> {shipFromInfo.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>SHIP TO:</div>
                          <div style={{ lineHeight: '1.4', fontSize: '10px' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {customerName !== 'N/A' ? customerName : 'N/A'}
                            </div>
                            {order.shippingAddress.address && (
                              <div>{order.shippingAddress.address}</div>
                            )}
                            <div>
                              {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                              {order.shippingAddress.state && `${order.shippingAddress.state} `}
                              {order.shippingAddress.pincode && `- ${order.shippingAddress.pincode}`}
                            </div>
                            {order.shippingAddress.phone && (
                              <div style={{ marginTop: '2px' }}>
                                <strong>Ph:</strong> {order.shippingAddress.phone}
                              </div>
                            )}
                            {order.shippingAddress.email && (
                              <div>
                                <strong>Email:</strong> {order.shippingAddress.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ borderTop: '1px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>ITEMS:</div>
                          {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} style={{ marginBottom: '3px', fontSize: '10px', lineHeight: '1.3' }}>
                              • {item.productName} {item.size && `(${item.size})`} - Qty: {item.quantity}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Order Total */}
                      <div style={{ borderTop: '1px solid #000', paddingTop: '8px', marginTop: '8px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          Total: ₹{order.totalAmount.toFixed(2)}
                        </div>
                      </div>

                      {/* Barcode Area (for future barcode implementation) */}
                      <div style={{ 
                        borderTop: '1px solid #000', 
                        paddingTop: '8px', 
                        marginTop: '8px',
                        textAlign: 'center',
                        fontSize: '9px',
                        color: '#666'
                      }}>
                        <div style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                          {order.orderId}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Generation Modal */}
      {showInvoiceModal && invoiceOrders.length > 0 && (
        <>
          {/* Modal Overlay */}
          <div
            className="no-print"
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
              padding: '20px',
            }}
            onClick={handleCloseInvoiceModal}
          >
            <div
              className="no-print"
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0 }}>Invoices ({invoiceOrders.length})</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-success"
                    onClick={handleDownloadInvoice}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fas fa-download"></i> Download PDF
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCloseInvoiceModal}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Invoice Preview */}
              <div className="invoice-print-container" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '10px'
              }}>
                {invoiceOrders.map((order, index) => {
                  const customerName = order.shippingAddress 
                    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
                    : 'N/A';
                  
                  return (
                    <div
                      key={order.orderId}
                      className="invoice"
                      style={{
                        border: '1px solid #ddd',
                        padding: '20px',
                        marginBottom: '20px',
                        background: '#fff',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '12px',
                      }}
                    >
                      {/* Invoice Header */}
                      <div className="invoice-header" style={{ borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>INVOICE</h2>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <div><strong>Invoice #:</strong> {order.orderId}</div>
                              <div><strong>Date:</strong> {order.createdAt ? formatDate(order.createdAt) : 'N/A'}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{shipFromInfo.companyName}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {shipFromInfo.address && <div>{shipFromInfo.address}</div>}
                              <div>
                                {shipFromInfo.city && `${shipFromInfo.city}, `}
                                {shipFromInfo.state && `${shipFromInfo.state} `}
                                {shipFromInfo.pincode && `- ${shipFromInfo.pincode}`}
                              </div>
                              {shipFromInfo.phone && <div>Ph: {shipFromInfo.phone}</div>}
                              {shipFromInfo.email && <div>{shipFromInfo.email}</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Body */}
                      <div className="invoice-body" style={{ marginBottom: '20px' }}>
                        {/* Bill To */}
                        {order.shippingAddress && (
                          <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Bill To:</h3>
                            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {customerName !== 'N/A' ? customerName : 'N/A'}
                              </div>
                              {order.shippingAddress.address && (
                                <div>{order.shippingAddress.address}</div>
                              )}
                              <div>
                                {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                                {order.shippingAddress.state && `${order.shippingAddress.state} `}
                                {order.shippingAddress.pincode && `- ${order.shippingAddress.pincode}`}
                              </div>
                              {order.shippingAddress.phone && (
                                <div style={{ marginTop: '5px' }}>Phone: {order.shippingAddress.phone}</div>
                              )}
                              {order.shippingAddress.email && (
                                <div>Email: {order.shippingAddress.email}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Items Table */}
                        {order.items && order.items.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Item</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Size</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Quantity</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Unit Price</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, itemIndex) => (
                                <tr key={itemIndex}>
                                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{item.productName}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{item.size || 'N/A'}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>₹{item.lineTotal.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Invoice Footer */}
                      <div className="invoice-footer" style={{ borderTop: '2px solid #000', paddingTop: '15px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ width: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                              <span style={{ fontWeight: 'bold' }}>Subtotal:</span>
                              <span>₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                              <span style={{ fontWeight: 'bold' }}>Tax:</span>
                              <span>₹0.00</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                              <span>Total:</span>
                              <span>₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ddd', fontSize: '11px', color: '#666', textAlign: 'center' }}>
                          <div>Payment Status: <strong>{order.paymentStatus || 'Completed'}</strong></div>
                          <div style={{ marginTop: '5px' }}>Thank you for your business!</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
