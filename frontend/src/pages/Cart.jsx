import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/useCart';

/**
 * Shopping Cart Page (Lab 05)
 * Route: /cart
 *
 * Consumes global CartContext for persistent, real-time cart state.
 * Supports quantity adjustment ([-] qty [+]) respecting product stock,
 * item removal, subtotal calculation, and Order Summary.
 */
function Cart() {
  const {
    cartItems,
    cartLoading,
    cartError,
    subtotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    refreshCart,
    actionLoadingId,
  } = useCart();

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');

  const handleQuantityDecrease = async (productId, currentQty) => {
    if (currentQty <= 1) return;
    const result = await updateQuantity(productId, currentQty - 1);
    if (!result.success) {
      setFeedbackMessage(result.message);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleQuantityIncrease = async (productId, currentQty, stock) => {
    if (currentQty >= stock) {
      setFeedbackMessage(`Only ${stock} units available in stock`);
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }
    const result = await updateQuantity(productId, currentQty + 1);
    if (!result.success) {
      setFeedbackMessage(result.message);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleRemove = async (productId) => {
    const result = await removeFromCart(productId);
    if (!result.success) {
      setFeedbackMessage(result.message);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleCheckoutClick = () => {
    setCheckoutNotice('Checkout and payment processing will be available in Lab 06!');
    setTimeout(() => setCheckoutNotice(''), 3500);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="cart-container">
          {/* Header */}
          <div className="cart-header">
            <h1 className="cart-title">Shopping Cart</h1>
            <p className="cart-subtitle">
              Review your items, adjust quantities, and proceed to checkout.
            </p>
          </div>

          {/* Inline Action Alert */}
          {feedbackMessage && (
            <div className="alert alert-error cart-alert">
              <span>⚠️</span>
              <span>{feedbackMessage}</span>
            </div>
          )}

          {checkoutNotice && (
            <div className="alert alert-info cart-alert">
              <span>ℹ️</span>
              <span>{checkoutNotice}</span>
            </div>
          )}

          {/* Loading State */}
          {cartLoading ? (
            <div className="cart-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading your cart...</p>
            </div>
          ) : cartError ? (
            /* Error State */
            <div className="cart-state-box error-state">
              <span className="state-icon">⚠️</span>
              <h2 className="empty-title">Something went wrong</h2>
              <p className="empty-description">{cartError}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm retry-btn"
                onClick={refreshCart}
              >
                Try Again
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="cart-state-box empty-state">
              <span className="state-icon">🛒</span>
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-description">
                Looks like you haven&apos;t added anything yet. Explore our catalog and find great products!
              </p>
              <Link to="/products" className="btn btn-primary browse-products-btn">
                Browse Products
              </Link>
            </div>
          ) : (
            /* Cart Content Grid: Items List + Order Summary */
            <div className="cart-layout-grid">
              {/* Cart Items List */}
              <div className="cart-items-section">
                <div className="cart-items-header">
                  <span>Product</span>
                  <span className="header-hide-mobile">Price</span>
                  <span>Quantity</span>
                  <span>Total</span>
                </div>

                <div className="cart-items-list">
                  {cartItems.map((item) => {
                    const product = item.product || {};
                    const isMutating = actionLoadingId === product._id;
                    const itemSubtotal = (Number(product.price) || 0) * item.quantity;
                    const isMaxStock = item.quantity >= product.stock;

                    return (
                      <div key={product._id || item._id} className="cart-item-row">
                        {/* Product Info */}
                        <div className="cart-item-info">
                          <Link to={`/products/${product._id}`} className="cart-item-thumb">
                            <img
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                          </Link>
                          <div className="cart-item-details">
                            <span className="cart-item-category">{product.category}</span>
                            <Link to={`/products/${product._id}`} className="cart-item-title">
                              {product.name}
                            </Link>
                            <span className="cart-item-unit-price mobile-only">
                              ₹{Number(product.price).toLocaleString('en-IN')} each
                            </span>
                            <button
                              type="button"
                              className="cart-item-remove-btn"
                              onClick={() => handleRemove(product._id)}
                              disabled={isMutating}
                            >
                              {isMutating ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        </div>

                        {/* Unit Price (Desktop) */}
                        <div className="cart-item-unit-price header-hide-mobile">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="cart-item-quantity">
                          <div className="quantity-stepper">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => handleQuantityDecrease(product._id, item.quantity)}
                              disabled={item.quantity <= 1 || isMutating}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="stepper-value">
                              {isMutating ? '…' : item.quantity}
                            </span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() =>
                                handleQuantityIncrease(product._id, item.quantity, product.stock)
                              }
                              disabled={isMaxStock || isMutating}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          {isMaxStock && (
                            <span className="stock-limit-note">Max stock ({product.stock})</span>
                          )}
                        </div>

                        {/* Item Subtotal */}
                        <div className="cart-item-subtotal">
                          ₹{itemSubtotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="cart-summary-section">
                <div className="order-summary-card">
                  <h2 className="summary-title">Order Summary</h2>

                  <div className="summary-row">
                    <span>Total Units</span>
                    <span className="summary-value font-medium">{cartCount} items</span>
                  </div>

                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span className="summary-value font-medium">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="summary-value text-success font-medium">Free</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row summary-total-row">
                    <span>Estimated Total</span>
                    <span className="summary-total-price">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Checkout Button (Preparation for Lab 06) */}
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-large checkout-btn"
                    onClick={handleCheckoutClick}
                  >
                    Proceed to Checkout →
                  </button>

                  <div className="summary-guarantee">
                    <span>🔒</span>
                    <span>Safe & Secure Checkout Guaranteed</span>
                  </div>
                </div>

                <div className="continue-shopping-box">
                  <Link to="/products" className="continue-shopping-link">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Cart;
