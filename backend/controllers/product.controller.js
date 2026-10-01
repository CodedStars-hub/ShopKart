const mongoose = require("mongoose");
const Product = require("../models/product.model");

// Helper to escape special characters for regex search
const escapeRegex = (string) => {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Create a new product
 * POST /products (Open API)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Check for missing required fields
    if (
      name === undefined ||
      name === null ||
      String(name).trim() === "" ||
      description === undefined ||
      description === null ||
      String(description).trim() === "" ||
      price === undefined ||
      price === null ||
      category === undefined ||
      category === null ||
      String(category).trim() === "" ||
      image === undefined ||
      image === null ||
      String(image).trim() === "" ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, price, category, image, stock are all required",
      });
    }

    // Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than 0",
      });
    }

    // Validate stock
    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
      return res.status(400).json({
        success: false,
        message: "Stock must be an integer greater than or equal to 0",
      });
    }

    const product = new Product({
      name: String(name).trim(),
      description: String(description).trim(),
      price: numericPrice,
      category: String(category).trim(),
      image: String(image).trim(),
      stock: numericStock,
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating product",
    });
  }
};

/**
 * Get all products with dynamic search and category filtering
 * GET /products?search=...&category=...&sort=...
 */
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const filter = {};

    // Name search: case-insensitive partial match
    if (search && search.trim() !== "") {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    // Category filter: exact match ignoring case
    if (category && category.trim() !== "" && category.trim().toLowerCase() !== "all categories") {
      filter.category = {
        $regex: `^${escapeRegex(category.trim())}$`,
        $options: "i",
      };
    }

    // Dynamic sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOptions = { price: 1 };
    } else if (sort === "price_desc") {
      sortOptions = { price: -1 };
    }

    const products = await Product.find(filter).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching products",
    });
  }
};

/**
 * Get single product by MongoDB _id
 * GET /products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
};
