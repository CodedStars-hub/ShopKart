import { Link } from 'react-router-dom';
import ShopKartLogo from './ShopKartLogo';

/**
 * Global Storefront Footer Component
 *
 * Clean, modern e-commerce footer displaying ShopKart brand identity,
 * internal catalog navigation, category quick links, and authentic project info.
 */
function Footer() {
  return (
    <footer className="storefront-footer">
      <div className="footer-container">
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/home" className="footer-logo-link" aria-label="ShopKart Storefront Home">
              <ShopKartLogo variant="dark" size="sm" />
            </Link>
            <p className="footer-tagline-text">
              Curated essentials across electronics, fashion, books, and home living.
              Built on the robust MERN stack with persistent cart and Razorpay checkout.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links-list">
              <li><Link to="/home">Home Storefront</Link></li>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/wishlist">My Wishlist</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
              <li><Link to="/orders">Order History</Link></li>
            </ul>
          </div>

          {/* Categories Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-links-list">
              <li><Link to="/products?category=Electronics">Electronics</Link></li>
              <li><Link to="/products?category=Fashion">Fashion</Link></li>
              <li><Link to="/products?category=Books">Books</Link></li>
              <li><Link to="/products?category=Home">Home & Living</Link></li>
            </ul>
          </div>

          {/* Project Details Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Engineering Project</h4>
            <ul className="footer-links-list">
              <li><span>Full-Stack MERN Architecture</span></li>
              <li><span>JWT HttpOnly Cookie Auth</span></li>
              <li><span>MongoDB Atlas Database</span></li>
              <li><span>Razorpay Test Mode Integration</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} ShopKart. All rights reserved. Engineering Labs 01–06.
          </p>
          <span className="footer-tech-pill">MERN E-Commerce</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
