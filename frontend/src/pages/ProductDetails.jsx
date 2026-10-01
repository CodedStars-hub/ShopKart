import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProductById } from '../services/productService';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/wishlistService';

/**
 * ProductDetails Page (Lab 03 & Lab 04)
 * Route: /products/:id
 *
 * Fetches single product details using MongoDB _id from URL params.
 * Displays large product image, name, description, price, category, stock,
 * and UI-only "Add to Cart" button (per Lab 03 spec).
 */
function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [addedToCartMessage, setAddedToCartMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProductData = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data.product || data);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        if (isMounted) {
          if (err.response?.status === 404) {
            setError('Product not found. The item you are looking for does not exist.');
          } else if (err.response?.status === 400) {
            setError('Invalid product ID provided.');
          } else {
            setError('Something went wrong while loading product details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const checkWishlistStatus = async () => {
      try {
        const data = await getWishlist();
        if (isMounted && data?.wishlist) {
          const exists = data.wishlist.some(
            (item) => (item._id || item).toString() === id
          );
          setIsWishlisted(exists);
        }
      } catch {
        // Silently ignore if unauthenticated
      }
    };

    loadProductData();
    checkWishlistStatus();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleWishlistToggle = async () => {
    if (savingWishlist || !product) return;

    setSavingWishlist(true);
    setWishlistMessage('');

    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
        setWishlistMessage('Removed from Wishlist');
      } else {
        await addToWishlist(product._id);
        setIsWishlisted(true);
        setWishlistMessage('Added to Wishlist');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Please login to add items to your wishlist'
          : 'Failed to update wishlist');
      setWishlistMessage(msg);
    } finally {
      setSavingWishlist(false);
      setTimeout(() => {
        setWishlistMessage('');
      }, 3000);
    }
  };

  // Add to Cart handler (UI-only for Lab 03 as specified)
  const handleAddToCart = () => {
    setAddedToCartMessage('Item added to cart! (Demo UI)');
    setTimeout(() => {
      setAddedToCartMessage('');
    }, 2500);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="product-details-container">
          {/* Breadcrumb / Back Link */}
          <div className="details-breadcrumb">
            <Link to="/products" className="back-link">
              ← Back to Products
            </Link>
          </div>

          {loading ? (
            <div className="details-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading product details...</p>
            </div>
          ) : error || !product ? (
            <div className="details-state-box error-state">
              <span className="state-icon">⚠️</span>
              <h2 className="empty-title">Could not load product</h2>
              <p className="empty-description">{error || 'Product not found.'}</p>
              <Link to="/products" className="btn btn-primary btn-sm">
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="product-details-card">
              {/* Product Image Column */}
              <div className="details-image-section">
                <img
                  src={product.image}
                  alt={product.name}
                  className="details-large-image"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              {/* Product Info Column */}
              <div className="details-info-section">
                <div className="details-meta-top">
                  <span className="product-category-badge">{product.category}</span>
                  <span
                    className={`product-stock-status ${
                      product.stock <= 0
                        ? 'stock-out'
                        : product.stock < 5
                        ? 'stock-low'
                        : 'stock-available'
                    }`}
                  >
                    {product.stock <= 0
                      ? 'Out of Stock'
                      : `${product.stock} units left in stock`}
                  </span>
                </div>

                <h1 className="details-title">{product.name}</h1>

                <div className="details-price-tag">
                  <span className="details-currency">₹</span>
                  <span className="details-price-number">
                    {Number(product.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="details-description-box">
                  <h3 className="section-label">Product Description</h3>
                  <p className="details-description">{product.description}</p>
                </div>

                {/* Notifications */}
                {wishlistMessage && (
                  <div className="alert alert-info details-alert">
                    <span>ℹ️</span>
                    <span>{wishlistMessage}</span>
                  </div>
                )}

                {addedToCartMessage && (
                  <div className="alert alert-success details-alert">
                    <span>🛒</span>
                    <span>{addedToCartMessage}</span>
                  </div>
                )}

                {/* Call to Action Buttons */}
                <div className="details-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-large add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                  >
                    🛒 Add to Cart
                  </button>

                  <button
                    type="button"
                    className={`btn btn-large wishlist-action-btn ${
                      isWishlisted ? 'btn-wishlisted' : 'btn-outline-primary'
                    }`}
                    onClick={handleWishlistToggle}
                    disabled={savingWishlist}
                  >
                    {savingWishlist
                      ? '⏳ Saving...'
                      : isWishlisted
                      ? '♥ Added to Wishlist'
                      : '♡ Add to Wishlist'}
                  </button>
                </div>

                <div className="details-footer-notice">
                  <span>🛡️</span>
                  <span>100% Genuine Product &bull; Secure Checkout &bull; Easy Returns</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;
