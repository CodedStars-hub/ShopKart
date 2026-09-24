import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Navbar component for ShopKart.
 * Displays ShopKart branding, Home navigation link, and Logout button.
 * Triggers POST /customers/logout to clear the HttpOnly session cookie on the backend.
 */
function Navbar() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call backend to clear the HttpOnly cookie
      await api.post('/customers/logout');
      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      // In case of error (e.g. cookie already expired), still redirect user to login
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-brand">
          <span className="brand-logo-icon">🛒</span>
          <span className="brand-name">ShopKart</span>
        </Link>

        <nav className="navbar-menu">
          <Link to="/home" className="nav-link">
            Home
          </Link>
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
