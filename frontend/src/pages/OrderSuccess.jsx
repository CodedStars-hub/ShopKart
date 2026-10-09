import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrderById } from '../services/orderService';

/**
 * Order Success Page (Lab 06)
 * Route: /order-success/:id
 *
 * Displays confirmed order details fetched from backend to guarantee
 * verified persistence after Razorpay payment verification.
 */
function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isSubscribed = true;

    getOrderById(id)
      .then((data) => {
        if (isSubscribed) {
          if (data?.success && data?.order) {
            setOrder(data.order);
          } else {
            setError('Could not retrieve order details.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Failed to load order:', err);
          setError(
            err.response?.data?.message || 'Unable to load confirmed order details.'
          );
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [id]);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="order-success-container">
          {loading ? (
            <div className="cart-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading confirmed order details...</p>
            </div>
          ) : error ? (
            <div className="cart-state-box error-state">
              <span className="state-icon">⚠️</span>
              <h2 className="empty-title">Notice</h2>
              <p className="empty-description">{error}</p>
              <div className="order-success-actions">
                <Link to="/orders" className="btn btn-primary">
                  View My Orders
                </Link>
                <Link to="/products" className="btn btn-secondary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="order-success-card">
              {/* Success Badge & Header */}
              <div className="order-success-header">
                <div className="success-icon-badge">✓</div>
                <h1 className="success-title">Order Placed Successfully!</h1>
                <p className="success-subtitle">
                  Thank you for shopping with ShopKart. Your payment has been verified and confirmed.
                </p>
              </div>

              {/* Order Meta Bar */}
              <div className="order-meta-grid">
                <div className="order-meta-item">
                  <span className="order-meta-label">Order ID</span>
                  <span className="order-meta-value code-font">{order._id}</span>
                </div>
                <div className="order-meta-item">
                  <span className="order-meta-label">Payment Status</span>
                  <span className={`status-badge status-${order.paymentStatus?.toLowerCase()}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="order-meta-item">
                  <span className="order-meta-label">Order Status</span>
                  <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-meta-item">
                  <span className="order-meta-label">Total Amount</span>
                  <span className="order-meta-value font-bold text-primary">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              {order.razorpayPaymentId && (
                <div className="payment-reference-banner">
                  <span className="ref-icon">💳</span>
                  <span>
                    Razorpay Payment ID: <strong className="code-font">{order.razorpayPaymentId}</strong>
                  </span>
                </div>
              )}

              {/* Purchased Items List */}
              <div className="order-items-summary">
                <h3 className="order-section-heading">Purchased Items ({order.items?.length || 0})</h3>
                <div className="order-items-list">
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-item-card">
                      <div className="order-item-img-wrap">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="order-item-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="order-item-img-placeholder">🛍️</div>
                        )}
                      </div>
                      <div className="order-item-info">
                        <h4 className="order-item-name">{item.name}</h4>
                        <span className="order-item-meta">
                          Quantity: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="order-item-subtotal">
                        ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              {order.shippingAddress && (
                <div className="order-shipping-summary">
                  <h3 className="order-section-heading">Delivery Address</h3>
                  <div className="shipping-address-box">
                    <strong>{order.shippingAddress.fullName}</strong>
                    <p>{order.shippingAddress.addressLine1}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                      {order.shippingAddress.pincode}
                    </p>
                    <p>Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="order-success-actions">
                <Link to="/orders" className="btn btn-primary btn-large">
                  View My Orders →
                </Link>
                <Link to="/products" className="btn btn-outline btn-large">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OrderSuccess;
