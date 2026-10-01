import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addToWishlist, removeFromWishlist } from '../services/wishlistService';

/**
 * ProductCard Component (Lab 03 & Lab 04)
 * Displays product image, name, price, category, stock status, "View Details",
 * and authenticated wishlist toggle action.
 */
function ProductCard({
  product,
  isWishlisted = false,
  onWishlistChange,
  showRemoveButton = false,
  onRemove,
}) {
  const [saving, setSaving] = useState(false);
  const [inWishlist, setInWishlist] = useState(isWishlisted);
  const [actionMessage, setActionMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Sync prop changes if parent state updates
  if (isWishlisted !== inWishlist && !saving && !actionMessage) {
    setInWishlist(isWishlisted);
  }

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (saving) return;

    setSaving(true);
    setActionMessage('');
    setIsError(false);

    try {
      if (inWishlist) {
        await removeFromWishlist(product._id);
        setInWishlist(false);
        setActionMessage('Removed from Wishlist');
        if (onWishlistChange) {
          onWishlistChange(product._id, false);
        }
      } else {
        await addToWishlist(product._id);
        setInWishlist(true);
        setActionMessage('Added to Wishlist');
        if (onWishlistChange) {
          onWishlistChange(product._id, true);
        }
      }
    } catch (err) {
      setIsError(true);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Please login to manage wishlist'
          : err.response?.status === 409
          ? 'Already in your wishlist'
          : 'Failed to update wishlist');
      setActionMessage(msg);
    } finally {
      setSaving(false);
      // Automatically clear temporary notification after 3 seconds
      setTimeout(() => {
        setActionMessage('');
      }, 3000);
    }
  };

  const handleDirectRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    if (onRemove) {
      onRemove(product._id);
    } else {
      handleWishlistClick(e);
    }
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-card">
      {/* Category Badge & Wishlist Action */}
      <div className="product-card-top">
        <span className="product-category-badge">{product.category}</span>
        {!showRemoveButton && (
          <button
            type="button"
            className={`wishlist-icon-btn ${inWishlist ? 'wishlisted' : ''}`}
            onClick={handleWishlistClick}
            disabled={saving}
            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label="Wishlist action"
          >
            {saving ? '⏳' : inWishlist ? '♥' : '♡'}
          </button>
        )}
      </div>

      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />
      </Link>

      {/* Product Content */}
      <div className="product-card-body">
        <h3 className="product-name" title={product.name}>
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>

        <div className="product-price-row">
          <span className="product-price">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>
          <span
            className={`product-stock-status ${
              isOutOfStock ? 'stock-out' : product.stock < 5 ? 'stock-low' : 'stock-available'
            }`}
          >
            {isOutOfStock
              ? 'Out of Stock'
              : `${product.stock} units left`}
          </span>
        </div>

        {/* Action feedback / error message */}
        {actionMessage && (
          <div className={`card-feedback ${isError ? 'feedback-error' : 'feedback-success'}`}>
            {actionMessage}
          </div>
        )}

        {/* Card Actions */}
        <div className="product-card-actions">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-outline btn-sm view-details-btn"
          >
            View Details
          </Link>

          {showRemoveButton ? (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm remove-wishlist-btn"
              onClick={handleDirectRemove}
              disabled={saving}
            >
              {saving ? 'Removing...' : 'Remove from Wishlist'}
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-sm wishlist-btn ${
                inWishlist ? 'btn-wishlisted' : 'btn-outline-primary'
              }`}
              onClick={handleWishlistClick}
              disabled={saving}
            >
              {saving ? (
                '⏳ Saving...'
              ) : inWishlist ? (
                '♥ Added to Wishlist'
              ) : (
                '♡ Add to Wishlist'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
