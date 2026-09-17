const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Read token from HttpOnly cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // 2. Verify JWT using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Extract customer ID (stored in sub) and find customer (exclude password)
    const customer = await Customer.findById(decoded.sub).select("-password");

    // 4. Check if customer still exists in database
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 5. Attach customer to req.user for use in downstream controllers
    req.user = customer;

    // 6. Continue to the next handler
    next();
  } catch (error) {
    // Token is either invalid or expired
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
