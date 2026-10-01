import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';

/**
 * Main Application Component for ShopKart (Labs 01 - 05).
 * Configures client-side routing with React Router & CartProvider:
 * - /register: Customer registration form
 * - /login: Customer login form
 * - /home: Protected customer dashboard
 * - /products: Dynamic product catalog & discovery (Lab 03)
 * - /products/:id: Product details view (Lab 03)
 * - /wishlist: Protected customer wishlist (Lab 04)
 * - /cart: Persistent shopping cart with global state (Lab 05)
 * - / and *: Redirects to /products
 */
function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Entry points */}
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* Public authentication routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Customer Dashboard */}
          <Route path="/home" element={<Home />} />

          {/* Lab 03: Product Catalog & Discovery */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Lab 04: Customer Wishlist */}
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Lab 05: Persistent Shopping Cart */}
          <Route path="/cart" element={<Cart />} />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
