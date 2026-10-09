const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const http = require("http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const app = require("./index");
const Customer = require("./models/customer.model");
const Product = require("./models/product.model");
const Order = require("./models/order.model");

async function runLab06Tests() {
  console.log("==================================================");
  console.log("RUNNING SHOPKART LAB 06 AUTOMATED TEST SUITE");
  console.log("==================================================\n");

  // Wait for mongoose connection if not yet connected
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
      setTimeout(resolve, 3000);
    });
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5003, resolve));
  const BASE_URL = "http://localhost:5003";
  console.log(`Lab 06 Test server running at ${BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    const timestamp = Date.now();
    const user1Email = `lab06_user1_${timestamp}@shopkart.test`;
    const user2Email = `lab06_user2_${timestamp}@shopkart.test`;

    // ------------------------------------------------------------------
    // STEP 1: AUTHENTICATION SETUP & USER ISOLATION
    // ------------------------------------------------------------------
    console.log("--- 1. AUTHENTICATION & UNPROTECTED ACCESS CHECKS ---");

    // Unauthenticated checks
    const unauthCreate = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAddress: {} }),
    });
    assert(unauthCreate.status === 401, "Test 1a: Unauthenticated create-payment-order returns 401");

    const unauthVerify = await fetch(`${BASE_URL}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert(unauthVerify.status === 401, "Test 1b: Unauthenticated verify-payment returns 401");

    const unauthGetOrders = await fetch(`${BASE_URL}/orders`);
    assert(unauthGetOrders.status === 401, "Test 1c: Unauthenticated GET /orders returns 401");

    const unauthGetOrder = await fetch(`${BASE_URL}/orders/66d000000000000000000000`);
    assert(unauthGetOrder.status === 401, "Test 1d: Unauthenticated GET /orders/:id returns 401");

    // Register & login User 1
    const regRes1 = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Aarav Sharma",
        email: user1Email,
        password: "password123",
        phone: "9876543210",
      }),
    });
    assert(regRes1.status === 201, "User 1 registered successfully");

    const loginRes1 = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user1Email, password: "password123" }),
    });
    const cookie1 = loginRes1.headers.get("set-cookie").split(";")[0];

    // Register & login User 2 (for isolation testing)
    await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Priya Patel",
        email: user2Email,
        password: "password123",
        phone: "9123456789",
      }),
    });
    const loginRes2 = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user2Email, password: "password123" }),
    });
    const cookie2 = loginRes2.headers.get("set-cookie").split(";")[0];

    // ------------------------------------------------------------------
    // STEP 2: EMPTY CART REJECTION & SHIPPING VALIDATIONS
    // ------------------------------------------------------------------
    console.log("\n--- 2. CART CHECK & SHIPPING VALIDATION TESTS ---");

    const validAddress = {
      fullName: "Aarav Sharma",
      phone: "9876543210",
      addressLine1: "22 MG Road, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    };

    // Test: Empty cart -> 400
    const emptyCartRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({ shippingAddress: validAddress }),
    });
    assert(emptyCartRes.status === 400, "Test 2: Empty cart checkout returns 400 Bad Request");
    const emptyCartData = await emptyCartRes.json();
    assert(
      emptyCartData.message.toLowerCase().includes("empty"),
      "Test 2: Useful error message returned for empty cart"
    );

    // Create a test product
    const testProduct = await Product.create({
      name: `Ergonomic Mouse ${timestamp}`,
      description: "High precision wireless ergonomic mouse",
      price: 1500,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-mouse.jpg",
      stock: 5,
    });

    // Add 2 units of test product to User 1's cart
    await fetch(`${BASE_URL}/cart/${testProduct._id}`, {
      method: "POST",
      headers: { Cookie: cookie1 },
    });
    await fetch(`${BASE_URL}/cart/${testProduct._id}`, {
      method: "POST",
      headers: { Cookie: cookie1 },
    });

    // Test: Invalid shipping details - missing field
    const missingFieldRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shippingAddress: {
          fullName: "Aarav Sharma",
          phone: "9876543210",
          addressLine1: "",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      }),
    });
    assert(missingFieldRes.status === 400, "Test 3a: Empty street address returns 400");

    // Test: Whitespace-only field
    const whitespaceRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shippingAddress: {
          ...validAddress,
          fullName: "   ",
        },
      }),
    });
    assert(whitespaceRes.status === 400, "Test 3b: Whitespace-only name returns 400");

    // Test: Invalid phone number
    const invalidPhoneRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shippingAddress: {
          ...validAddress,
          phone: "12345",
        },
      }),
    });
    assert(invalidPhoneRes.status === 400, "Test 3c: Invalid phone format returns 400");

    // Test: Invalid pincode (5 digits)
    const invalidPinRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shippingAddress: {
          ...validAddress,
          pincode: "56001",
        },
      }),
    });
    assert(invalidPinRes.status === 400, "Test 3d: Non-6-digit pincode returns 400");

    // ------------------------------------------------------------------
    // STEP 3: STOCK & DELETED PRODUCT VALIDATION
    // ------------------------------------------------------------------
    console.log("\n--- 3. STOCK & PRODUCT AVAILABILITY TESTS ---");

    // Temporarily reduce stock to 1 (cart has 2)
    testProduct.stock = 1;
    await testProduct.save();

    const stockExceededRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({ shippingAddress: validAddress }),
    });
    assert(stockExceededRes.status === 400, "Test 4a: Insufficient stock at checkout returns 400");
    const stockExceededData = await stockExceededRes.json();
    assert(
      stockExceededData.message.includes("Insufficient stock"),
      "Test 4a: Clear insufficient stock message returned"
    );

    // Restore stock to 10
    testProduct.stock = 10;
    await testProduct.save();

    // Test product deletion handling
    const doomedProduct = await Product.create({
      name: "Doomed Gadget",
      description: "Will be deleted",
      price: 500,
      category: "Electronics",
      image: "https://example.com/gadget.jpg",
      stock: 5,
    });
    await fetch(`${BASE_URL}/cart/${doomedProduct._id}`, {
      method: "POST",
      headers: { Cookie: cookie1 },
    });
    // Now delete product from DB
    await Product.findByIdAndDelete(doomedProduct._id);

    const deletedProdRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({ shippingAddress: validAddress }),
    });
    assert(deletedProdRes.status === 400, "Test 4b: Deleted product in cart returns 400");

    // Remove deleted product from user cart directly to restore clean cart
    const u1Doc = await Customer.findOne({ email: user1Email });
    u1Doc.cart = u1Doc.cart.filter((i) => i.product.toString() !== doomedProduct._id.toString());
    await u1Doc.save();

    // ------------------------------------------------------------------
    // STEP 4: TRUSTED SERVER TOTAL & ORDER CREATION
    // ------------------------------------------------------------------
    console.log("\n--- 4. SERVER TOTAL CALCULATION & ORDER CREATION ---");

    // Cart currently has 2 units of testProduct (price 1500 each => 3000)
    // Send a manipulated fake total in request body
    const createOrderRes = await fetch(`${BASE_URL}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shippingAddress: validAddress,
        totalAmount: 1, // Tampering attempt
        items: [{ price: 0.01 }], // Tampering attempt
      }),
    });

    assert(
      createOrderRes.status === 201 || createOrderRes.status === 502,
      "Test 5: Order creation request handled safely"
    );

    // Let's inspect the order created in database
    const createdOrder = await Order.findOne({ user: u1Doc._id }).sort({ createdAt: -1 });
    assert(Boolean(createdOrder), "Test 6: Order document persisted in MongoDB");
    assert(
      createdOrder.totalAmount === 3000,
      "Test 7: Server calculated trusted total (₹3000), ignoring frontend tampering"
    );
    assert(
      createdOrder.paymentStatus === "PENDING" || createdOrder.paymentStatus === "FAILED",
      "Test 8: Initial order paymentStatus is correctly set"
    );
    assert(
      createdOrder.items[0].price === 1500 && createdOrder.items[0].quantity === 2,
      "Test 9: Item snapshot stores purchase-time price and quantity"
    );

    // Confirm database cart is STILL NOT CLEARED before verification
    const cartBeforeVerify = await Customer.findById(u1Doc._id);
    assert(
      cartBeforeVerify.cart.length > 0,
      "Test 10: Cart remains untouched after payment order creation"
    );

    // ------------------------------------------------------------------
    // STEP 5: CRYPTOGRAPHIC SIGNATURE VERIFICATION
    // ------------------------------------------------------------------
    console.log("\n--- 5. PAYMENT SIGNATURE VERIFICATION & CART CLEARING ---");

    // Set order to a known test Razorpay Order ID for cryptographic test
    createdOrder.razorpayOrderId = "order_test_" + timestamp;
    createdOrder.paymentStatus = "PENDING";
    createdOrder.status = "PENDING_PAYMENT";
    await createdOrder.save();

    // Test: Fake signature rejection
    const fakeVerifyRes = await fetch(`${BASE_URL}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shopKartOrderId: createdOrder._id.toString(),
        razorpay_order_id: createdOrder.razorpayOrderId,
        razorpay_payment_id: "pay_test_123456",
        razorpay_signature: "fake_forged_signature_000000000000",
      }),
    });
    assert(fakeVerifyRes.status === 400, "Test 11a: Fake signature returns 400 Bad Request");

    // Confirm order is NOT marked paid and cart is NOT cleared on fake signature
    const orderAfterFake = await Order.findById(createdOrder._id);
    assert(orderAfterFake.paymentStatus !== "PAID", "Test 11b: Order is not marked PAID on fake signature");
    const cartAfterFake = await Customer.findById(u1Doc._id);
    assert(cartAfterFake.cart.length > 0, "Test 11c: Cart is NOT cleared on fake signature");

    // Generate real cryptographic HMAC SHA-256 signature
    const testPaymentId = "pay_valid_" + timestamp;
    const payload = `${createdOrder.razorpayOrderId}|${testPaymentId}`;
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    // Test: Valid signature verification
    const validVerifyRes = await fetch(`${BASE_URL}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shopKartOrderId: createdOrder._id.toString(),
        razorpay_order_id: createdOrder.razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    assert(validVerifyRes.status === 200, "Test 12: Valid HMAC signature verification returns 200 OK");
    const verifyData = await validVerifyRes.json();
    assert(verifyData.success === true, "Test 12: verify-payment success is true");

    // Confirm updated state
    const orderAfterValid = await Order.findById(createdOrder._id);
    assert(orderAfterValid.paymentStatus === "PAID", "Test 13: Order paymentStatus updated to PAID");
    assert(orderAfterValid.status === "PLACED", "Test 14: Order status updated to PLACED");
    assert(
      orderAfterValid.razorpayPaymentId === testPaymentId,
      "Test 15: razorpayPaymentId stored in Order document"
    );

    // Confirm stock was deducted (was 10, bought 2 -> should be 8)
    const productAfterPurchase = await Product.findById(testProduct._id);
    assert(productAfterPurchase.stock === 8, "Test 16: Product stock correctly decremented from 10 to 8");

    // Confirm database cart is cleared ONLY AFTER successful verification
    const cartAfterValid = await Customer.findById(u1Doc._id);
    assert(
      cartAfterValid.cart.length === 0,
      "Test 17: Authenticated customer cart cleared in MongoDB after successful verification"
    );

    // Test: Repeated verification idempotency
    const repeatVerifyRes = await fetch(`${BASE_URL}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie1 },
      body: JSON.stringify({
        shopKartOrderId: createdOrder._id.toString(),
        razorpay_order_id: createdOrder.razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    assert(repeatVerifyRes.status === 200, "Test 18: Repeated verification returns 200 idempotent response");

    // ------------------------------------------------------------------
    // STEP 6: ORDER RETRIEVAL, ACCESS CONTROL & SNAPSHOT INTEGRITY
    // ------------------------------------------------------------------
    console.log("\n--- 6. ORDER RETRIEVAL, ISOLATION & SNAPSHOT INTEGRITY ---");

    // User 1 fetches My Orders
    const user1OrdersRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Cookie: cookie1 },
    });
    assert(user1OrdersRes.status === 200, "Test 19a: GET /orders returns 200 for User 1");
    const user1OrdersData = await user1OrdersRes.json();
    assert(user1OrdersData.orders.length >= 1, "Test 19b: User 1 sees their placed order");

    // User 2 fetches My Orders (should have 0 orders)
    const user2OrdersRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Cookie: cookie2 },
    });
    const user2OrdersData = await user2OrdersRes.json();
    assert(user2OrdersData.orders.length === 0, "Test 20: User 2 has 0 orders (strict isolation)");

    // User 2 attempts to fetch User 1's order by ID -> 403 Forbidden
    const crossAccessRes = await fetch(`${BASE_URL}/orders/${createdOrder._id}`, {
      headers: { Cookie: cookie2 },
    });
    assert(crossAccessRes.status === 403, "Test 21: Cross-user access to order returns 403 Forbidden");

    // Modify the original product's name and price
    testProduct.name = "Renamed Ultra Mouse";
    testProduct.price = 9999;
    await testProduct.save();

    // Re-fetch historical order for User 1
    const historicalOrderRes = await fetch(`${BASE_URL}/orders/${createdOrder._id}`, {
      headers: { Cookie: cookie1 },
    });
    assert(historicalOrderRes.status === 200, "Test 22a: Historical order fetched successfully");
    const historicalData = await historicalOrderRes.json();
    const snapItem = historicalData.order.items[0];

    assert(
      snapItem.price === 1500,
      "Test 22b: Historical order retains purchase-time price (₹1500, not current ₹9999)"
    );
    assert(
      snapItem.name.startsWith("Ergonomic Mouse"),
      "Test 22c: Historical order retains purchase-time product name snapshot"
    );

    console.log("\n==================================================");
    console.log(`ALL LAB 06 TESTS PASSED! (${passedTests}/${totalTests} PASS)`);
    console.log("==================================================");

    server.close();
    process.exit(0);
  } catch (error) {
    console.error("\nLAB 06 TEST RUN FAILED:", error.message);
    server.close();
    process.exit(1);
  }
}

runLab06Tests();
