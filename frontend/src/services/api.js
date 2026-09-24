import axios from 'axios';

/**
 * Centralized Axios instance for ShopKart.
 * 
 * - baseURL: '' relies on the Vite development proxy defined in vite.config.js.
 *   Requests to '/customers/...' are proxied to 'http://localhost:5000/customers/...'.
 * - withCredentials: true ensures HttpOnly authentication cookies (such as 'token')
 *   are automatically sent with every request and stored by the browser.
 */
const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
