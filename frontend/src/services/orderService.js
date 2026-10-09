import api from './api';

/**
 * Order & Checkout API Service for ShopKart (Lab 06)
 * Handles payment order creation, cryptographic verification, and order retrieval.
 */

export const createPaymentOrder = async (shippingAddress) => {
  const response = await api.post('/orders/create-payment-order', { shippingAddress });
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post('/orders/verify-payment', paymentData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export default {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};
