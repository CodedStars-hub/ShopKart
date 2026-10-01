import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
} from '../services/cartService';

const CartContext = createContext(null);

/**
 * CartProvider Component (Lab 05)
 * Single shared source of truth for Shopping Cart state across the entire frontend application.
 *
 * Owned state:
 * - cartItems: array of { product: Object, quantity: Number }
 * - cartLoading: boolean
 * - cartError: string | null
 * - actionLoadingId: string | null (tracks productId currently being mutated for per-item loading)
 *
 * Derived values:
 * - subtotal: Sum of (product.price * quantity)
 * - cartCount: Sum of all item quantities (total units)
 */
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Refresh cart from backend
  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const data = await getCart();
      setCartItems(data.cart || []);
    } catch (err) {
      if (err.response?.status === 401) {
        // Visitor is not logged in: clear cart without showing error screen
        setCartItems([]);
      } else {
        console.error('Failed to load cart:', err);
        setCartError("Unable to load your cart.");
      }
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Fetch initial cart state on application mount
  useEffect(() => {
    let isSubscribed = true;

    getCart()
      .then((data) => {
        if (isSubscribed) {
          setCartItems(data.cart || []);
          setCartLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          if (err.response?.status === 401) {
            setCartItems([]);
          } else {
            console.error('Initial cart fetch error:', err);
            setCartError("Unable to load your cart.");
          }
          setCartLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Add product to cart or increment quantity
  const addToCart = useCallback(async (productId) => {
    setActionLoadingId(productId);
    try {
      const data = await apiAddToCart(productId);
      if (data?.cart) {
        setCartItems(data.cart);
      }
      return { success: true, message: data?.message || 'Added to cart' };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Please log in to add items to your cart'
          : 'Failed to add item to cart');
      return { success: false, message: msg };
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    setActionLoadingId(productId);
    try {
      const data = await apiUpdateCartQuantity(productId, quantity);
      if (data?.cart) {
        setCartItems(data.cart);
      }
      return { success: true, message: data?.message || 'Quantity updated' };
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to update quantity';
      return { success: false, message: msg };
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    setActionLoadingId(productId);
    try {
      const data = await apiRemoveFromCart(productId);
      if (data?.cart) {
        setCartItems(data.cart);
      } else {
        // Fallback filter
        setCartItems((prev) =>
          prev.filter((item) => (item.product?._id || item.product) !== productId)
        );
      }
      return { success: true, message: data?.message || 'Item removed from cart' };
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to remove item from cart';
      return { success: false, message: msg };
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  // Calculate derived values directly from cartItems
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return acc + price * qty;
    }, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0);
    }, 0);
  }, [cartItems]);

  const contextValue = useMemo(
    () => ({
      cartItems,
      cartLoading,
      cartError,
      actionLoadingId,
      subtotal,
      cartCount,
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
    }),
    [
      cartItems,
      cartLoading,
      cartError,
      actionLoadingId,
      subtotal,
      cartCount,
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
