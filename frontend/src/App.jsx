import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

/**
 * Main Application Component for ShopKart.
 * Configures client-side routing with React Router:
 * - /register: Customer registration form
 * - /login: Customer login form
 * - /home: Protected customer dashboard (verifies session via GET /customers/me)
 * - / and *: Redirects to /home (which automatically redirects to /login if unauthenticated)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default entry point: redirects to /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Public authentication routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected route */}
        <Route path="/home" element={<Home />} />

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
