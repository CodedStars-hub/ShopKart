const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

/**
 * Add a product to the authenticated customer's wishlist
 * POST /wishlist/:productId
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if the product exists in Product collection
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Retrieve current customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check for duplicate in wishlist
    const alreadyExists = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Product is already in your wishlist",
      });
    }

    // Add ObjectId to wishlist
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding to wishlist",
    });
  }
};

/**
 * Get all products in the authenticated customer's wishlist
 * GET /wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock createdAt",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const wishlistProducts = customer.wishlist || [];

    return res.status(200).json({
      success: true,
      count: wishlistProducts.length,
      wishlist: wishlistProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching wishlist",
    });
  }
};

/**
 * Remove a product from the authenticated customer's wishlist
 * DELETE /wishlist/:productId
 */
const removeFromWishlist = async (req, res) => {
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

    // Check if product is currently in wishlist
    const exists = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in your wishlist",
      });
    }

    // Remove reference
    customer.wishlist = customer.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while removing from wishlist",
    });
  }
};

/**
 * Toggle product in wishlist (Bonus endpoint)
 * PATCH /wishlist/:productId/toggle
 */
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

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

    const exists = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (exists) {
      customer.wishlist = customer.wishlist.filter(
        (id) => id.toString() !== productId
      );
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Product removed from wishlist",
      });
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      customer.wishlist.push(productId);
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: true,
        message: "Product added to wishlist",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling wishlist",
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
};
