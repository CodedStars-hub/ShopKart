import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyOrders } from '../services/orderService';

/**
 * My Orders Page (Lab 06)
 * Route: /orders
 *
 * Displays all past orders for the authenticated user, sorted newest first.
 * Includes expandable details, item snapshots, payment status, and empty/loading states.
 */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    getMyOrders()
      .then((data) => {
        if (isSubscribed) {
          if (data?.success) {
            setOrders(data.orders || []);
          } else {
            setError('Could not load orders.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Failed to fetch orders:', err);
          setError(
            err.response?.data?.message || 'Unable to retrieve your orders. Please log in.'
          );
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="orders-container">
          {/* Header */}
          <div className="orders-header">
            <h1 className="orders-title">My Orders</h1>
            <p className="orders-subtitle">
              Track and view history for all your past ShopKart purchases.
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="cart-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading your orders...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="cart-state-box error-state">
              <span className="state-icon">⚠️</span>
              <h2 className="empty-title">Unable to Load Orders</h2>
              <p className="empty-description">{error}</p>
              <Link to="/products" className="btn btn-primary btn-sm retry-btn">
                Browse Products
              </Link>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="cart-state-box empty-state">
              <span className="state-icon">📦</span>
              <h2 className="empty-title">No orders placed yet</h2>
              <p className="empty-description">
                You haven&apos;t placed any orders with ShopKart yet. Discover our catalog and find something you love!
              </p>
              <Link to="/products" className="btn btn-primary btn-large">
                Start Shopping →
              </Link>
            </div>
          ) : (
            /* Orders List */
            <div className="orders-list">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const totalItemsCount = (order.items || []).reduce(
                  (sum, it) => sum + (it.quantity || 1),
                  0
                );

                return (
                  <div key={order._id} className="order-card">
                    {/* Order Summary Header Bar */}
                    <div className="order-card-header">
                      <div className="order-header-info">
                        <div className="order-id-block">
                          <span className="label-dim">Order ID:</span>
                          <span className="order-id-code code-font">{order._id}</span>
                        </div>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="order-header-badges">
                        <span
                          className={`status-badge status-${(
                            order.paymentStatus || 'pending'
                          ).toLowerCase()}`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span
                          className={`status-badge status-${(
                            order.status || 'pending_payment'
                          ).toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="order-card-body">
                      <div className="order-preview-items">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="order-preview-item">
                            <div className="order-thumb">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="order-thumb-img"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="order-thumb-placeholder">🛍️</span>
                              )}
                            </div>
                            <div className="order-thumb-info">
                              <span className="order-thumb-name">{item.name}</span>
                              <span className="order-thumb-qty">
                                Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total & Action Bar */}
                      <div className="order-card-footer">
                        <div className="order-total-block">
                          <span className="label-dim">
                            Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}):
                          </span>
                          <span className="order-footer-price">
                            ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="order-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => toggleExpand(order._id)}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                          <Link
                            to={`/order-success/${order._id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Receipt ↗
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Order Details Drawer */}
                    {isExpanded && (
                      <div className="order-drawer">
                        <div className="order-drawer-grid">
                          {/* Shipping address details */}
                          <div className="drawer-section">
                            <h4 className="drawer-heading">Shipping Address</h4>
                            {order.shippingAddress ? (
                              <div className="drawer-address-text">
                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.addressLine1}</p>
                                <p>
                                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                                  {order.shippingAddress.pincode}
                                </p>
                                <p>Phone: {order.shippingAddress.phone}</p>
                              </div>
                            ) : (
                              <p className="label-dim">Not provided</p>
                            )}
                          </div>

                          {/* Payment gateway references */}
                          <div className="drawer-section">
                            <h4 className="drawer-heading">Payment Information</h4>
                            <div className="drawer-payment-details">
                              <p>
                                <span className="label-dim">Razorpay Order ID: </span>
                                <span className="code-font">{order.razorpayOrderId || 'N/A'}</span>
                              </p>
                              <p>
                                <span className="label-dim">Razorpay Payment ID: </span>
                                <span className="code-font">{order.razorpayPaymentId || 'N/A'}</span>
                              </p>
                              <p>
                                <span className="label-dim">Gateway Status: </span>
                                <span className="font-medium">{order.paymentStatus}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Orders;
