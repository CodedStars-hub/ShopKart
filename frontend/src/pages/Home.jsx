import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

/**
 * Protected Home Page
 * Route: /home
 * 
 * Flow:
 * 1. Component mounts.
 * 2. Calls GET /customers/me to verify authentication.
 * 3. Browser automatically attaches the HttpOnly cookie.
 * 4. If 200 OK: Displays the authenticated customer profile.
 * 5. If 401 Unauthorized: Redirects immediately to /login.
 * 
 * Note: Customer profile is NOT stored in localStorage or sessionStorage.
 * The backend /customers/me API is the single source of truth.
 */
function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isSubscribed = true;

    const fetchCustomerProfile = async () => {
      try {
        const response = await api.get('/customers/me');
        if (isSubscribed) {
          setCustomer(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isSubscribed) {
          // If 401 or any auth failure, redirect to /login
          if (err.response?.status === 401) {
            navigate('/login', { replace: true });
          } else {
            setError('Failed to fetch profile. Please try logging in again.');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 1500);
          }
        }
      }
    };

    fetchCustomerProfile();

    return () => {
      isSubscribed = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="home-loading-screen">
        <div className="spinner-large"></div>
        <p className="loading-text">Verifying authentication & loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-loading-screen">
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <div className="home-container">
          {/* Welcome Banner */}
          <div className="welcome-card">
            <div className="welcome-header">
              <div className="welcome-avatar">
                {customer?.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="welcome-text">
                <span className="welcome-tag">Authenticated Session</span>
                <h1 className="welcome-title">
                  Welcome, {customer?.fullName || 'Customer'}!
                </h1>
                <p className="welcome-subtitle">
                  You are successfully logged in to your ShopKart customer account.
                </p>
              </div>
            </div>

            {/* Profile Details Card */}
            <div className="profile-details-grid">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{customer?.fullName}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{customer?.email}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Phone Number</span>
                <span className="detail-value">{customer?.phone}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Customer ID</span>
                <span className="detail-value text-muted font-mono">
                  {customer?._id}
                </span>
              </div>
            </div>

            {/* Status Information Box */}
            <div className="security-notice">
              <span className="notice-icon">🔒</span>
              <div className="notice-content">
                <strong>Session Security Notice:</strong>
                <p>
                  Authentication is managed securely using an HttpOnly JWT cookie set by the backend.
                  No tokens or credentials are stored in localStorage or sessionStorage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
