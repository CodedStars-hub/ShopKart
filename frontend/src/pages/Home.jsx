import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import api from '../services/api';
import { getProducts } from '../services/productService';
import { getWishlist } from '../services/wishlistService';

/**
 * Storefront Home Page (Protected Customer Portal & Storefront)
 * Route: /home
 *
 * Combines full e-commerce shopping discovery with authenticated session security:
 * 1. Verifies authentication via GET /customers/me (preserves HttpOnly session & Lab 01/02 redirects).
 * 2. Spacious Storefront Hero Section with clear CTA navigating to catalog.
 * 3. Shop by Category cards with direct links to filtered products.
 * 4. Featured Products grid consuming live catalog items with working Cart & Wishlist actions.
 * 5. Shopping Benefits highlighting authentic platform capabilities.
 * 6. Accessible Customer Profile & Session Security section.
 * 7. Clean, professional storefront footer.
 */
function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Storefront catalog data
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);

  // Profile section toggle (accessible overview)
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  // Authenticate customer on mount
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

  // Load featured products & wishlist
  useEffect(() => {
    let isSubscribed = true;

    // Fetch products
    getProducts()
      .then((data) => {
        if (isSubscribed) {
          const all = data.products || [];
          // Pick a curated selection of up to 4 diverse products
          const sample = all.slice(0, 4);
          setFeaturedProducts(sample);
          setProductsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load featured products:', err);
        if (isSubscribed) setProductsLoading(false);
      });

    // Fetch wishlist for initial hearts
    getWishlist()
      .then((data) => {
        if (isSubscribed && data?.wishlist) {
          const idSet = new Set(data.wishlist.map((item) => (item._id || item).toString()));
          setWishlistIds(idSet);
          setWishlistCount(data.count ?? idSet.size);
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleWishlistChange = (productId, isAdded) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isAdded) {
        next.add(productId.toString());
      } else {
        next.delete(productId.toString());
      }
      setWishlistCount(next.size);
      return next;
    });
  };

  const categories = [
    {
      name: 'Electronics',
      desc: 'Mechanical keyboards, headphones & smart gear',
      icon: '⚡',
      link: '/products?category=Electronics',
    },
    {
      name: 'Fashion',
      desc: 'Denim jackets, leather backpacks & timeless apparel',
      icon: '🧥',
      link: '/products?category=Fashion',
    },
    {
      name: 'Books',
      desc: 'Software craftsmanship & systems architecture',
      icon: '📚',
      link: '/products?category=Books',
    },
    {
      name: 'Home',
      desc: 'Ceramic coffee drippers & ultrasonic diffusers',
      icon: '☕',
      link: '/products?category=Home',
    },
  ];

  if (loading) {
    return (
      <div className="home-loading-screen">
        <div className="spinner-large"></div>
        <p className="loading-text">Verifying authentication & loading storefront...</p>
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
      <Navbar wishlistCount={wishlistCount} />

      <main className="main-content storefront-main">
        {/* =================================================================
            1. HERO SECTION: Storefront Welcome & Call-to-Action
            ================================================================= */}
        <section className="storefront-hero" aria-label="Hero Introduction">
          <div className="hero-content">
            <span className="hero-eyebrow">
              Welcome back, {customer?.fullName?.split(' ')[0] || 'Customer'} 👋
            </span>
            <h1 className="hero-title">Find Your Next Favourite.</h1>
            <p className="hero-description">
              Explore quality electronics, timeless apparel, engineering literature,
              and artisanal home essentials. Built with real-time cart persistence and verified checkout.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large">
                Explore Products →
              </Link>
              <a href="#categories-section" className="btn btn-outline btn-large">
                Browse Categories
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="hero-tag-badge">Curated Collection</div>
              <div className="hero-stats-row">
                <div className="hero-stat-item">
                  <span className="stat-number">4</span>
                  <span className="stat-label">Categories</span>
                </div>
                <div className="hero-stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Verified DB</span>
                </div>
                <div className="hero-stat-item">
                  <span className="stat-number">Test</span>
                  <span className="stat-label">Razorpay Mode</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. SHOP BY CATEGORY
            ================================================================= */}
        <section id="categories-section" className="storefront-section" aria-label="Shop by Category">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">
                Browse hand-picked essentials tailored to your daily work, style, and living.
              </p>
            </div>
            <Link to="/products" className="section-link">
              View All →
            </Link>
          </div>

          <div className="category-cards-grid">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.link}
                className="category-card"
                aria-label={`Explore ${cat.name} products`}
              >
                <div className="category-card-icon">{cat.icon}</div>
                <h3 className="category-card-title">{cat.name}</h3>
                <p className="category-card-desc">{cat.desc}</p>
                <span className="category-card-action">Explore category &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* =================================================================
            3. FEATURED PRODUCTS
            ================================================================= */}
        <section className="storefront-section" aria-label="Featured Products">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">
                Top items from our live catalog with verified pricing and real-time stock.
              </p>
            </div>
            <Link to="/products" className="section-link">
              Explore Full Catalog ({featuredProducts.length > 0 ? 'Active' : '...'}) →
            </Link>
          </div>

          {productsLoading ? (
            <div className="catalog-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading featured products...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="catalog-state-box empty-state">
              <p className="state-message">No products currently available.</p>
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isWishlisted={wishlistIds.has(product._id.toString())}
                  onWishlistChange={handleWishlistChange}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================================
            4. SHOPPING BENEFITS (Real platform features only)
            ================================================================= */}
        <section className="storefront-section benefits-section" aria-label="Platform Highlights">
          <h2 className="section-title text-center">Built for Seamless E-Commerce</h2>
          <p className="section-subtitle text-center">
            Engineered across six full-stack labs with reliable data persistence and security.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🔍</div>
              <h3 className="benefit-title">Product Discovery</h3>
              <p className="benefit-text">
                Dynamic server-side text search, category filtering, and stock-aware catalog views.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">💖</div>
              <h3 className="benefit-title">Curated Wishlist</h3>
              <p className="benefit-text">
                Save and organize your favorite items. Fully isolated per authenticated customer.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🛒</div>
              <h3 className="benefit-title">Persistent Cart</h3>
              <p className="benefit-text">
                Shopping cart embedded in your customer record. Retains items across browser sessions.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">💳</div>
              <h3 className="benefit-title">Verified Orders</h3>
              <p className="benefit-text">
                Razorpay Test Mode checkout with backend HMAC-SHA256 signature verification.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================
            5. CUSTOMER ACCOUNT & SESSION OVERVIEW
            (Preserves all customer profile data and security notice from Lab 02)
            ================================================================= */}
        <section className="storefront-section account-overview-section" aria-label="Customer Account Details">
          <div className="account-summary-card">
            <div className="account-summary-header">
              <div className="account-avatar-circle">
                {customer?.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="account-summary-titles">
                <span className="badge-authenticated">Active Secure Session</span>
                <h3 className="account-summary-name">{customer?.fullName}</h3>
                <p className="account-summary-email">{customer?.email}</p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm account-toggle-btn"
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                aria-expanded={showProfileDetails}
              >
                {showProfileDetails ? 'Hide Account Details ▲' : 'View Account Details ▼'}
              </button>
            </div>

            {showProfileDetails && (
              <div className="account-expanded-details">
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
                    <span className="detail-value">{customer?.phone || 'Not provided'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Customer ID</span>
                    <span className="detail-value text-muted font-mono">
                      {customer?._id}
                    </span>
                  </div>
                </div>

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
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
