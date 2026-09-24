import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Login Page
 * Route: /login
 * Authenticates the customer with email and password.
 * On success, backend sets an HttpOnly JWT cookie and frontend redirects to /home.
 * Does NOT store JWT in localStorage or sessionStorage.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled component state for form inputs
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Client validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  // Server error message (e.g. "Invalid Credentials")
  const [serverError, setServerError] = useState('');
  // Loading state
  const [loading, setLoading] = useState(false);

  // Success message passed from registration redirect (if any)
  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');

  // Handle changes for controlled inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (serverError) {
      setServerError('');
    }
    if (infoMessage) {
      setInfoMessage('');
    }
  };

  // Client validation
  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      // api sends withCredentials: true so the backend can set the HttpOnly cookie
      const response = await api.post('/customers/login', payload);

      if (response.data?.success) {
        // Successful login: navigate to protected /home
        navigate('/home', { replace: true });
      }
    } catch (err) {
      if (err.response) {
        // Backend returns 401 for invalid credentials
        if (err.response.status === 401) {
          setServerError('Invalid Credentials');
        } else {
          setServerError(err.response.data?.message || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        setServerError('Cannot connect to the server. Please check if the backend is running.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">🛒 ShopKart</div>
          <h1 className="auth-title">Customer Login</h1>
          <p className="auth-subtitle">Sign in to access your ShopKart account</p>
        </div>

        {/* Informational Message (e.g. from registration redirect) */}
        {infoMessage && (
          <div className="alert alert-info" role="status">
            <span className="alert-icon">ℹ️</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Server Error Message */}
        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. harshita@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="error-text">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="error-text">{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span> Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
