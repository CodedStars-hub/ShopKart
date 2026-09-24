import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Register Page
 * Route: /register
 * Allows new customers to register for ShopKart.
 * Validates inputs locally before submitting to POST /customers/register.
 */
function Register() {
  const navigate = useNavigate();

  // Controlled component state for form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  // Validation errors for each field
  const [fieldErrors, setFieldErrors] = useState({});
  // General server/network error message
  const [serverError, setServerError] = useState('');
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  // Loading state while API request is in-flight
  const [loading, setLoading] = useState(false);

  // Handle input changes for controlled components
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client-side validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim().replace(/[-\s]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Run client validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      const response = await api.post('/customers/register', payload);

      if (response.data?.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        // Brief delay so user sees confirmation before redirect
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Registration successful! Please login with your credentials.' },
          });
        }, 1200);
      }
    } catch (err) {
      if (err.response) {
        // Backend returned an error response (e.g. 400, 409, 500)
        const message = err.response.data?.message || 'Registration failed. Please check your details.';
        setServerError(message);
      } else if (err.request) {
        // Network error / server not responding
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ShopKart today and start shopping</p>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="alert alert-success" role="alert">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={`form-input ${fieldErrors.fullName ? 'input-error' : ''}`}
              placeholder="e.g. Harshita Gupta"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              autoComplete="name"
            />
            {fieldErrors.fullName && (
              <span className="error-text">{fieldErrors.fullName}</span>
            )}
          </div>

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
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="error-text">{fieldErrors.password}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              autoComplete="tel"
            />
            {fieldErrors.phone && (
              <span className="error-text">{fieldErrors.phone}</span>
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
                <span className="spinner"></span> Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
