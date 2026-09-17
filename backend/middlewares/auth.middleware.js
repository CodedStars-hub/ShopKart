const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.sub).select("-password");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
