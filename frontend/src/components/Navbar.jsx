import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getWishlist } from '../services/wishlistService';

/**
 * Navbar component for ShopKart.
 * Displays ShopKart branding, navigation links (Home | Products | Wishlist), and Logout button.
 * Triggers POST /customers/logout to clear the HttpOnly session cookie on the backend.
 */
function Navbar({ wishlistCount }) {
  const navigate = useNavigate();
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

  const displayCount = typeof wishlistCount === 'number' ? wishlistCount : fetchedCount;

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
            {displayCount !== null && displayCount > 0 && (
              <span className="wishlist-badge">{displayCount}</span>
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
