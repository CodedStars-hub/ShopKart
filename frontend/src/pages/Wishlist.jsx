import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';

/**
 * Wishlist Page (Lab 04)
 * Route: /wishlist
 *
 * Protected customer wishlist view.
 * Fetches user-specific wishlist via GET /wishlist.
 * Supports dynamic removal via DELETE /wishlist/:productId without page reload.
 * Handles loading, error, and empty states.
 */
function Wishlist() {
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isSubscribed = true;

    getWishlist()
      .then((data) => {
        if (isSubscribed) {
          setWishlistItems(data.wishlist || []);
          setError(false);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          if (err.response?.status === 401) {
            navigate('/login', {
              replace: true,
              state: { message: 'Please log in to access your wishlist.' },
            });
          } else {
            setError(true);
            setErrorMessage("We couldn't load your wishlist.");
            setLoading(false);
          }
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [navigate, retryCount]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((prev) => prev + 1);
  };

  // Handle direct item removal from wishlist
  const handleRemoveItem = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar wishlistCount={wishlistItems.length} />

      <main className="main-content">
        <div className="wishlist-container">
          {/* Wishlist Header */}
          <div className="wishlist-header">
            <h1 className="wishlist-title">My Wishlist</h1>
            <p className="wishlist-subtitle">
              Items you have saved for later. Keep track of products you love.
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="wishlist-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading your wishlist...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="wishlist-state-box error-state">
              <span className="state-icon">⚠️</span>
              <h2 className="empty-title">Something went wrong.</h2>
              <p className="empty-description">{errorMessage}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm retry-btn"
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          ) : wishlistItems.length === 0 ? (
            /* Empty State */
            <div className="wishlist-state-box empty-state">
              <span className="state-icon wishlist-empty-heart">❤️</span>
              <h2 className="empty-title">Your wishlist is empty</h2>
              <p className="empty-description">
                Save products you love and find them here later.
              </p>
              <Link to="/products" className="btn btn-primary browse-products-btn">
                Browse Products
              </Link>
            </div>
          ) : (
            /* Wishlist Products Grid */
            <>
              <div className="wishlist-count-banner">
                <span>
                  You have <strong>{wishlistItems.length}</strong>{' '}
                  {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
                </span>
              </div>

              <div className="product-grid">
                {wishlistItems.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isWishlisted={true}
                    showRemoveButton={true}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Wishlist;
