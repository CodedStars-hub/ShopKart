import api from './api';

/**
 * Shopping Cart API Service for ShopKart (Lab 05)
 * Communicates with backend endpoints using HttpOnly session cookie.
 */

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (productId) => {
  const response = await api.post(`/cart/${productId}`);
  return response.data;
};

export const updateCartQuantity = async (productId, quantity) => {
  const response = await api.patch(`/cart/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

export default {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
};
