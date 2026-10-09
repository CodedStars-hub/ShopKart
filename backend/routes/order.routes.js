const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} = require("../controllers/order.controller");

const authMiddleware = require("../middlewares/auth.middleware");

// All order endpoints require customer authentication
router.use(authMiddleware);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);

module.exports = router;
