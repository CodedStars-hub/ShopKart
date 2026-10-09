import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/useCart';
import { createPaymentOrder, verifyPayment } from '../services/orderService';

/**
 * Loads Razorpay Standard Checkout SDK script dynamically.
 * @returns {Promise<boolean>} Resolves true when loaded, false if failed
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Checkout Page Component (Lab 06)
 * Route: /checkout
 *
 * Implements validated shipping address collection, trusted order preview,
 * Razorpay Test Mode checkout initiation, and cryptographic signature verification.
 */
function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartLoading, subtotal, cartCount, clearCart } = useCart();

  // Controlled form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Validation & status states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);

  // Redirect to cart if cart is empty after initial loading
  useEffect(() => {
    if (!cartLoading && (!cartItems || cartItems.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cartLoading, cartItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  /**
   * Client-side validation:
   * Non-empty trimmed fields, 10-digit Indian phone, 6-digit Indian pincode.
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.trim();
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      }
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else {
      const cleanPincode = formData.pincode.trim();
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(cleanPincode)) {
        newErrors.pincode = 'Pincode must be exactly 6 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Prevent concurrent duplicate submissions
    if (isSubmittingRef.current || isProcessing) {
      return;
    }

    setApiError('');

    // Step 1: Client-side validation
    if (!validateForm()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
      // Step 2: Ensure Razorpay SDK is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          'Failed to load Razorpay payment SDK. Please check your internet connection and try again.'
        );
      }

      // Step 3: Call backend to create payment order
      // Never send prices, totals, or item lists; backend loads them authoritatively from DB
      const shippingPayload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };

      const orderData = await createPaymentOrder(shippingPayload);

      if (!orderData?.success) {
        throw new Error(orderData?.message || 'Failed to initialize payment order');
      }

      const {
        shopKartOrderId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
      } = orderData;

      // Step 4: Configure and open Razorpay Standard Checkout
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'ShopKart',
        description: 'Order Checkout Payment (Test Mode)',
        order_id: razorpayOrderId,
        prefill: {
          name: shippingPayload.fullName,
          contact: shippingPayload.phone,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            isSubmittingRef.current = false;
            setApiError(
              'Payment was cancelled or dismissed. Your cart has been preserved.'
            );
          },
        },
        handler: async (response) => {
          try {
            // Step 5: Submit payment callback to backend for cryptographic signature verification
            const verifyRes = await verifyPayment({
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes?.success) {
              // Step 6: Payment confirmed by backend. Synchronize global cart state and navigate
              clearCart();
              navigate(`/order-success/${shopKartOrderId}`, { replace: true });
            } else {
              throw new Error(verifyRes?.message || 'Payment signature verification failed');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setIsProcessing(false);
            isSubmittingRef.current = false;
            setApiError(
              verifyErr.response?.data?.message ||
                verifyErr.message ||
                'Payment verification failed. Please contact support.'
            );
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failureResponse) => {
        console.error('Razorpay payment failed:', failureResponse.error);
        setIsProcessing(false);
        isSubmittingRef.current = false;
        setApiError(
          failureResponse.error?.description ||
            'Payment failed at the gateway. Your cart has been preserved.'
        );
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      isSubmittingRef.current = false;
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred during checkout. Please try again.';
      setApiError(errorMsg);
    }
  };

  if (cartLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <div className="cart-state-box">
            <div className="spinner-large"></div>
            <p className="state-message">Preparing checkout...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="checkout-container">
          <div className="checkout-header">
            <h1 className="checkout-title">Secure Checkout</h1>
            <p className="checkout-subtitle">
              Provide your delivery address and pay securely via Razorpay Test Mode.
            </p>
          </div>

          {apiError && (
            <div className="alert alert-error checkout-alert" role="alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-body">
                <strong>Checkout Notice:</strong> {apiError}
              </div>
            </div>
          )}

          <div className="checkout-layout-grid">
            {/* Left: Shipping Address Form */}
            <div className="checkout-form-section">
              <div className="checkout-card">
                <h2 className="section-title">1. Shipping Address</h2>
                <p className="section-subtitle">
                  Where should we deliver your order?
                </p>

                <form onSubmit={handlePlaceOrder} noValidate>
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                      placeholder="e.g. Aarav Sharma"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isProcessing}
                    />
                    {errors.fullName && (
                      <span className="field-error">{errors.fullName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="10-digit mobile number, e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isProcessing}
                    />
                    {errors.phone && (
                      <span className="field-error">{errors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="addressLine1" className="form-label">
                      Street Address <span className="text-danger">*</span>
                    </label>
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      type="text"
                      className={`form-input ${errors.addressLine1 ? 'input-error' : ''}`}
                      placeholder="House / Flat No., Street, Landmark"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      disabled={isProcessing}
                    />
                    {errors.addressLine1 && (
                      <span className="field-error">{errors.addressLine1}</span>
                    )}
                  </div>

                  <div className="form-row-three">
                    <div className="form-group">
                      <label htmlFor="city" className="form-label">
                        City <span className="text-danger">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        className={`form-input ${errors.city ? 'input-error' : ''}`}
                        placeholder="e.g. Bengaluru"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={isProcessing}
                      />
                      {errors.city && (
                        <span className="field-error">{errors.city}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="state" className="form-label">
                        State <span className="text-danger">*</span>
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        className={`form-input ${errors.state ? 'input-error' : ''}`}
                        placeholder="e.g. Karnataka"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={isProcessing}
                      />
                      {errors.state && (
                        <span className="field-error">{errors.state}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="pincode" className="form-label">
                        Pincode <span className="text-danger">*</span>
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        maxLength="6"
                        className={`form-input ${errors.pincode ? 'input-error' : ''}`}
                        placeholder="6 digits, e.g. 560001"
                        value={formData.pincode}
                        onChange={handleChange}
                        disabled={isProcessing}
                      />
                      {errors.pincode && (
                        <span className="field-error">{errors.pincode}</span>
                      )}
                    </div>
                  </div>

                  <div className="checkout-actions-desktop">
                    <button
                      type="submit"
                      className="btn btn-primary btn-block btn-large place-order-btn"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-inline"></span>
                          Processing Payment...
                        </>
                      ) : (
                        `Pay ₹${subtotal.toLocaleString('en-IN')} with Razorpay →`
                      )}
                    </button>
                    <div className="checkout-security-tag">
                      <span>🔒</span>
                      <span>Razorpay Test Mode • 256-Bit SSL Encryption</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Order Summary Preview */}
            <div className="checkout-summary-section">
              <div className="order-summary-card">
                <h2 className="summary-title">Order Items ({cartCount})</h2>

                <div className="checkout-items-list">
                  {cartItems.map((item) => {
                    const product = item.product || {};
                    const price = Number(product.price) || 0;
                    const lineTotal = price * item.quantity;

                    return (
                      <div key={product._id} className="checkout-item-row">
                        <div className="checkout-item-thumb">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="checkout-item-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="checkout-item-placeholder">🛍️</div>
                          )}
                        </div>

                        <div className="checkout-item-details">
                          <h4 className="checkout-item-name">{product.name}</h4>
                          <span className="checkout-item-meta">
                            Qty: {item.quantity} × ₹{price.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="checkout-item-total">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="summary-value font-medium">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Delivery Charges</span>
                  <span className="summary-value text-success font-medium">FREE</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row summary-total-row">
                  <span>Grand Total</span>
                  <span className="summary-total-price">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="summary-server-notice">
                  <span>⚡</span>
                  <span>Items, stock, and total amount will be verified authoritatively by the server.</span>
                </div>

                <div className="checkout-actions-mobile">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className="btn btn-primary btn-block btn-large place-order-btn"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing Payment...' : `Pay ₹${subtotal.toLocaleString('en-IN')} →`}
                  </button>
                </div>

                <div className="back-to-cart-box">
                  <Link to="/cart" className="continue-shopping-link">
                    ← Back to Shopping Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
