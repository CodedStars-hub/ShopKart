const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
} = require("../controllers/product.controller");

// Product routes (Open APIs for Lab 03)
router.post("/", createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);

module.exports = router;
