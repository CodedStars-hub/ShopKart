import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getWishlist } from '../services/wishlistService';
import { useCart } from '../context/useCart';

/**
 * Navbar component for ShopKart (Lab 01 - Lab 05).
 * Displays branding, navigation (Home | Products | Wishlist | Cart), and Logout button.
 * Cart count is dynamically consumed from CartContext (representing total units).
 */
function Navbar({ wishlistCount }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [fetchedCount, setFetchedCount] = useState(null);

  useEffect(() => {
    // If parent passed explicit count, do not fetch
    if (typeof wishlistCount === 'number') {
      return;
    }

    let isMounted = true;
    getWishlist()
      .then((data) => {
        if (isMounted && data?.count !== undefined) {
          setFetchedCount(data.count);
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated on public views
      });

    return () => {
      isMounted = false;
    };
  }, [wishlistCount]);

  const displayWishlistCount = typeof wishlistCount === 'number' ? wishlistCount : fetchedCount;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/customers/logout');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/products" className="navbar-brand">
          <span className="brand-logo-icon">🛒</span>
          <span className="brand-name">ShopKart</span>
        </Link>

        <nav className="navbar-menu">
          <NavLink
            to="/home"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Products
          </NavLink>
          <NavLink
            to="/wishlist"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Wishlist
            {displayWishlistCount !== null && displayWishlistCount > 0 && (
              <span className="wishlist-badge">{displayWishlistCount}</span>
            )}
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Cart
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-outline-danger btn-sm"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
