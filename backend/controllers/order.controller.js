const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const { getRazorpayInstance } = require("../utils/razorpay");

/**
 * Validates shipping address fields and formats.
 * @returns {null | string} error message if invalid, or null if valid
 */
const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return "Shipping address is required";
  }

  const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

  const fields = [
    { name: "Full name", value: fullName },
    { name: "Phone number", value: phone },
    { name: "Address line 1", value: addressLine1 },
    { name: "City", value: city },
    { name: "State", value: state },
    { name: "Pincode", value: pincode },
  ];

  for (const field of fields) {
    if (
      field.value === undefined ||
      field.value === null ||
      typeof field.value !== "string" ||
      field.value.trim() === ""
    ) {
      return `${field.name} is required and cannot be empty`;
    }
  }

  // Indian phone validation (10 digits with optional +91 or 0 prefix)
  const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.trim())) {
    return "Invalid phone number. Please enter a valid 10-digit Indian mobile number";
  }

  // Indian pincode validation (exactly 6 digits)
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(pincode.trim())) {
    return "Invalid pincode. Pincode must be exactly 6 digits";
  }

  return null;
};

/**
 * POST /orders/create-payment-order
 * Protected endpoint to validate cart, stock, calculate trusted total,
 * create draft Order, and generate Razorpay payment order.
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    // 2. Fetch authenticated customer and their cart from MongoDB
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before checking out",
      });
    }

    // 3. Load latest Product documents for all cart items to guarantee current prices and stock
    const cartProductIds = customer.cart.map((item) => item.product);
    const productsInDb = await Product.find({ _id: { $in: cartProductIds } });
    const productMap = new Map(productsInDb.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let calculatedTotal = 0;

    for (const cartItem of customer.cart) {
      const productIdStr = cartItem.product.toString();
      const product = productMap.get(productIdStr);

      // Check if product was deleted or is missing
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available. Please update your cart.",
        });
      }

      // Recheck real-time stock
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${cartItem.quantity}`,
        });
      }

      // Calculate line total and accumulate server-authoritative total
      const lineTotal = product.price * cartItem.quantity;
      calculatedTotal += lineTotal;

      // Create immutable item snapshot
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image || "",
      });
    }

    // Enforce minimum purchase amount
    if (calculatedTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total order amount must be greater than zero",
      });
    }

    // Cleaned shipping address snapshot
    const sanitizedShipping = {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      addressLine1: shippingAddress.addressLine1.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim(),
    };

    // 4. Create and persist ShopKart Order in MongoDB
    const newOrder = new Order({
      user: customer._id,
      items: orderItems,
      shippingAddress: sanitizedShipping,
      totalAmount: Math.round(calculatedTotal * 100) / 100,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await newOrder.save();

    // 5. Create Razorpay Order via SDK
    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      const amountInPaise = Math.round(newOrder.totalAmount * 100);

      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: newOrder._id.toString(),
        notes: {
          shopKartOrderId: newOrder._id.toString(),
          customerEmail: customer.email,
        },
      });
    } catch (razorpayErr) {
      // Safely handle failure so pending order is not left in a usable pending state
      newOrder.paymentStatus = "FAILED";
      await newOrder.save();

      console.error("Razorpay order creation failed:", razorpayErr.message);
      return res.status(502).json({
        success: false,
        message:
          "Unable to initiate payment with Razorpay gateway. Please check server gateway configuration and try again.",
        error: process.env.NODE_ENV === "development" ? razorpayErr.message : undefined,
      });
    }

    // 6. Link Razorpay Order ID to ShopKart Order
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    // 7. Return checkout details to frontend (never expose Key Secret)
    return res.status(201).json({
      success: true,
      shopKartOrderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error in createPaymentOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating payment order",
    });
  }
};

/**
 * POST /orders/verify-payment
 * Protected endpoint to cryptographically verify payment signature,
 * mark order as PAID/PLACED, and clear user's cart in MongoDB.
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Basic validation of required inputs
    if (
      !shopKartOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ShopKart order ID",
      });
    }

    // 2. Retrieve ShopKart Order and verify ownership
    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission to verify this order",
      });
    }

    // 3. Handle repeated verification requests safely (idempotency)
    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          order,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Order is already paid and cannot be reassigned to a different payment",
      });
    }

    // 4. Verify Razorpay Order ID matches the trusted order ID in database
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch with stored order record",
      });
    }

    // 5. Calculate expected HMAC SHA-256 signature using secret from backend environment
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway secret not configured on server",
      });
    }

    const payload = `${order.razorpayOrderId}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    // 6. Safe timing-safe comparison
    let isSignatureValid = false;
    const generatedBuffer = Buffer.from(generatedSignature, "utf-8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf-8");

    if (generatedBuffer.length === receivedBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
    }

    if (!isSignatureValid) {
      // Mark payment failed in order record
      order.paymentStatus = "FAILED";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid signature",
      });
    }

    // 7. Update order to PAID and PLACED
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // 8. Deduct product stocks
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 9. ONLY after successful verification, clear the customer's database cart
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and order placed",
      order,
    });
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while verifying payment",
    });
  }
};

/**
 * GET /orders
 * Protected endpoint returning all orders belonging to authenticated customer.
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error in getMyOrders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching orders",
    });
  }
};

/**
 * GET /orders/:id
 * Protected endpoint returning single order details by ID for authenticated customer.
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Enforce order ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order details",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};
