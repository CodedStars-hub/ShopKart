const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

/**
 * Add product to cart or increment quantity by 1
 * POST /cart/:productId
 */
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find the product to ensure existence and check real-time stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Retrieve authenticated customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if product already exists in customer's cart
    const existingCartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + 1;

      // Enforce stock validation
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Reached available stock limit of ${product.stock} units`,
        });
      }

      existingCartItem.quantity = newQuantity;
    } else {
      // First time adding this product
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: "Product is out of stock",
        });
      }

      customer.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    await customer.save();

    // Populate product details for response
    await customer.populate({
      path: "cart.product",
      select: "name price category image stock",
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding to cart",
    });
  }
};

/**
 * Get authenticated customer's cart with populated product data
 * GET /cart
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price category image stock",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Filter out any orphaned items if product was deleted from DB
    const validCart = (customer.cart || []).filter((item) => item.product != null);

    return res.status(200).json({
      success: true,
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching cart",
    });
  }
};

/**
 * Update quantity of a specific cart item
 * PATCH /cart/:productId
 * Body: { quantity: number }
 */
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity parameter
    const numQty = Number(quantity);
    if (quantity === undefined || quantity === null || isNaN(numQty) || !Number.isInteger(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer of at least 1",
      });
    }

    // Verify product exists in database to check stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if product is in cart
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Validate against product stock
    if (numQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity cannot exceed available stock of ${product.stock}`,
      });
    }

    cartItem.quantity = numQty;
    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price category image stock",
    });

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating cart quantity",
    });
  }
};

/**
 * Remove an item from authenticated customer's cart
 * DELETE /cart/:productId
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const itemExists = customer.cart.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price category image stock",
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while removing item from cart",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
